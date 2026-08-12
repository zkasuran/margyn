/**
 * The Markdown Margyn posts on a pull request and writes to the CI job summary.
 * It carries a hidden marker so the GitHub Action can find its own previous
 * comment and edit it in place, rather than adding a new one on every push.
 *
 * When findings have been through proof mode, each carries a badge and any
 * retracted finding is listed apart, because "we withdrew this, it did not
 * reproduce" is exactly what a reviewer should see rather than a silent drop.
 */
export const MARKER = "<!-- margyn-report -->";

const BADGE = { reproduced: "✅ reproduced", observed: "✅ observed", shown: "· shown" };

function fence(lines) {
  return ["```", ...lines, "```"].join("\n");
}

function detail(f) {
  const where = `\`${f.file}\``;
  const badge = f.proven ? ` ${BADGE[f.proven.status] ?? ""}` : "";
  const head = `<summary><strong>${f.check}</strong> ${where}${badge} — ${f.summary}</summary>`;
  const parts = [head, ""];
  if (f.why) parts.push(f.why, "");
  if (f.proven?.status === "reproduced" && f.proven.output) {
    parts.push("Proved by running:", fence(f.proven.output.split("\n")));
  } else if (f.reproduction?.length) {
    parts.push("Reproduce:", fence(f.reproduction));
  }
  return `<details>\n${parts.join("\n")}\n</details>`;
}

/**
 * @param findings the kept findings
 * @param opts.retracted findings proof mode withdrew
 * @param opts.version CLI version for the footer
 */
export function toMarkdown(findings, opts = {}) {
  const retracted = opts.retracted ?? [];
  const lines = [MARKER];

  if (findings.length === 0) {
    lines.push(
      "### Margyn: nothing hollow found",
      "",
      "Every check Margyn knows how to test held up. The safety net has no holes it can see.",
    );
  } else {
    const n = findings.length;
    lines.push(`### Margyn found ${n} hole${n === 1 ? "" : "s"} in your safety net`, "");
    lines.push("| severity | check | where |", "| --- | --- | --- |");
    for (const f of findings) lines.push(`| ${f.severity} | ${f.check} | \`${f.file}\` |`);
    lines.push("");
    for (const f of findings) lines.push(detail(f));
  }

  if (retracted.length) {
    lines.push(
      "",
      `<sub>Margyn withdrew ${retracted.length} finding${retracted.length === 1 ? "" : "s"} it could not reproduce on this tree: ` +
        retracted.map((f) => `\`${f.check}\` ${f.file}`).join(", ") +
        ".</sub>",
    );
  }

  lines.push(
    "",
    `<sub>Every finding ships a command that reproduces it. [Margyn](https://margyn.xyz)${opts.version ? ` ${opts.version}` : ""} audits the verification layer, not the code.</sub>`,
  );
  return lines.join("\n");
}
