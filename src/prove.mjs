/**
 * Proof mode: Margyn runs each finding's own proof and reports what actually
 * happened, rather than leaving a command for someone else to run.
 *
 * The whole product rests on one promise: every finding ships a reproduction you
 * can run. Proof mode makes that literal. For a finding it can verify, it runs
 * the proof commands in the repository and checks the output carries the markers
 * the finding predicted. A finding whose proof reproduces is certified. A finding
 * whose proof does NOT reproduce is retracted, because a checker that cannot show
 * its own finding is as hollow as the checks this tool hunts.
 *
 * Only read-only commands are auto-run. A `proof` is either:
 *   { verifiable: true, commands: [...], expect: [...] }  run and certify
 *   { verifiable: false, note: "..." }                    shown, not auto-run
 * A finding with no `proof` at all is treated as not auto-verifiable.
 */
import { execFileSync } from "node:child_process";

/** Runs one proof command in the repo, capturing stdout and stderr together. */
function runOne(root, command, timeoutMs) {
  try {
    const out = execFileSync("sh", ["-c", command], {
      cwd: root,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { out, ok: true };
  } catch (error) {
    // A non-zero exit is not a failure of the proof: `test -f x && echo` exits
    // non-zero when the file is absent, which is itself the answer. We judge on
    // the captured output, never on the exit code.
    const out = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    return { out, ok: false, timedOut: error.signal === "SIGTERM" };
  }
}

/**
 * Runs the proof for one finding. Returns the finding annotated with a `proven`
 * block: `{ status, output, missing }`. Status is one of:
 *   "reproduced"  every expected marker appeared
 *   "retracted"   verifiable, but a marker was missing (likely a false positive)
 *   "observed"    not auto-run, but established while scanning (the mutation proof)
 *   "shown"       not auto-run, output is for a human to read
 */
export function proveFinding(root, finding, timeoutMs = 15_000) {
  const proof = finding.proof;
  if (!proof || proof.verifiable !== true) {
    return {
      ...finding,
      proven: {
        status: proof?.observed ? "observed" : "shown",
        note: proof?.note,
        output: "",
      },
    };
  }

  let output = "";
  for (const command of proof.commands) {
    const { out, timedOut } = runOne(root, command, timeoutMs);
    output += out;
    if (timedOut) output += `\n[proof command timed out after ${timeoutMs}ms]\n`;
  }
  const missing = proof.expect.filter((marker) => !output.includes(marker));
  return {
    ...finding,
    proven: {
      status: missing.length === 0 ? "reproduced" : "retracted",
      output: output.trim(),
      missing,
    },
  };
}

/**
 * Runs proof for every finding and splits them. Retracted findings are dropped
 * from what a gate acts on, because Margyn will not fail your build on a finding
 * it could not itself reproduce. They are returned separately so the run can say
 * out loud what it withdrew.
 *
 * @returns { kept, retracted, tally }
 */
export function prove(root, findings, opts = {}) {
  const proven = findings.map((f) => proveFinding(root, f, opts.timeoutMs));
  const retracted = proven.filter((f) => f.proven.status === "retracted");
  const kept = proven.filter((f) => f.proven.status !== "retracted");
  const tally = {
    total: findings.length,
    reproduced: proven.filter((f) => f.proven.status === "reproduced").length,
    observed: proven.filter((f) => f.proven.status === "observed").length,
    shown: proven.filter((f) => f.proven.status === "shown").length,
    retracted: retracted.length,
  };
  return { kept, retracted, tally };
}
