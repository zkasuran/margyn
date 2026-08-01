import { ignoredSource } from "./checks/ignored-source.mjs";
import { lintBlindspots } from "./checks/lint-blindspots.mjs";
import { unrunChecks } from "./checks/unrun-checks.mjs";

export const CHECKS = [
  { name: "ignored-source", run: ignoredSource },
  { name: "unrun-check", run: unrunChecks },
  { name: "lint-blindspot", run: lintBlindspots },
];

const ORDER = { high: 0, medium: 1, low: 2 };

/**
 * Runs every check over a repository and returns findings, most severe first.
 * A finding without a reproduction is dropped rather than reported, because the
 * reproduction is the only thing that makes a finding a fact.
 */
export function scan(root) {
  const findings = [];
  for (const check of CHECKS) {
    let out = [];
    try {
      out = check.run(root) ?? [];
    } catch (error) {
      findings.push({
        check: check.name,
        severity: "low",
        file: ".",
        summary: `check "${check.name}" could not complete`,
        evidence: String(error?.message ?? error),
        reproduction: ["# re-run the scan with --debug to see the stack"],
        why: "A check that cannot run is reported rather than silently skipped, on the same principle the tool applies to your repository.",
      });
      continue;
    }
    for (const finding of out) {
      if (!finding.reproduction?.length) continue;
      findings.push(finding);
    }
  }
  findings.sort((a, b) => (ORDER[a.severity] ?? 3) - (ORDER[b.severity] ?? 3));
  return findings;
}
