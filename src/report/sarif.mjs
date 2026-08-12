/**
 * SARIF 2.1.0 output, so findings land in GitHub's Security tab and any tool that
 * reads SARIF. Written by hand rather than pulled from a library, because the
 * whole CLI has no runtime dependency and a report format is not the place to
 * start.
 *
 * A finding's file is sometimes `path:line`. SARIF wants them apart, so the line
 * is split back out into a region and the bare path becomes the artifact URI.
 */

/** GitHub renders error, warning and note. Our three severities map onto them. */
const LEVEL = { high: "error", medium: "warning", low: "note" };

/** Splits `src/a.mjs:12` into its path and line. A path with no line is fine. */
function locationOf(file) {
  const m = /^(.*):(\d+)$/.exec(file);
  if (!m) return { uri: file };
  return { uri: m[1], line: Number(m[2]) };
}

function messageText(finding) {
  const lines = [finding.summary];
  if (finding.why) lines.push("", finding.why);
  if (finding.reproduction?.length) lines.push("", "Reproduce:", ...finding.reproduction);
  return lines.join("\n");
}

/**
 * Builds the SARIF document. One rule per distinct check that fired, so the
 * Security tab groups them, and one result per finding.
 *
 * @param findings the findings to report
 * @param opts.version the CLI version, recorded on the tool driver
 */
export function toSarif(findings, opts = {}) {
  const checks = [...new Set(findings.map((f) => f.check))];
  const rules = checks.map((id) => ({
    id,
    name: id,
    shortDescription: { text: `margyn ${id}` },
    helpUri: `https://margyn.xyz/docs#${id}`,
    properties: { category: "verification-layer" },
  }));
  const ruleIndex = new Map(checks.map((id, i) => [id, i]));

  const results = findings.map((f) => {
    const { uri, line } = locationOf(f.file);
    const region = line ? { startLine: line } : undefined;
    return {
      ruleId: f.check,
      ruleIndex: ruleIndex.get(f.check),
      level: LEVEL[f.severity] ?? "warning",
      message: { text: messageText(f) },
      locations: [{ physicalLocation: { artifactLocation: { uri }, ...(region ? { region } : {}) } }],
    };
  });

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Margyn",
            informationUri: "https://margyn.xyz",
            version: opts.version ?? "0.0.0",
            rules,
          },
        },
        results,
      },
    ],
  };
}
