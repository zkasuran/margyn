import { cannotFail } from "./checks/cannot-fail.mjs";
import { ignoredSource } from "./checks/ignored-source.mjs";
import { lintBlindspots } from "./checks/lint-blindspots.mjs";
import { mutationProof } from "./checks/mutation.mjs";
import { noAssertion } from "./checks/no-assertion.mjs";
import { unrunChecks } from "./checks/unrun-checks.mjs";

/** Static checks. Cheap, deterministic, and safe to run anywhere. */
export const CHECKS = [
  { name: "ignored-source", run: ignoredSource },
  { name: "no-assertion", run: noAssertion },
  { name: "cannot-fail", run: cannotFail },
  { name: "unrun-check", run: unrunChecks },
  { name: "lint-blindspot", run: lintBlindspots },
];

const ORDER = { high: 0, medium: 1, low: 2 };

/**
 * Runs every check over a repository and returns findings, most severe first.
 * A finding without a reproduction is dropped rather than reported, because the
 * reproduction is the only thing that turns a finding into a fact.
 *
 * @param opts.mutate run the mutation proof too. Off by default: it executes the
 *   real test suite once per mutation, so it is slow and it writes to the tree
 *   before restoring it.
 */
export function scan(root, opts = {}) {
  const checks = opts.mutate
    ? [...CHECKS, { name: "mutation", run: (r) => mutationProof(r, opts) }]
    : CHECKS;

  const findings = [];
  for (const check of checks) {
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
        reproduction: ["# re-run the scan to see whether this is reproducible"],
        why: "A check that cannot run is reported rather than silently skipped, on the same principle this tool applies to your repository.",
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
