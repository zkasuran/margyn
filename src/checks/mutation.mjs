/**
 * CHECK 5: the mutation proof, which is the strongest evidence this tool has.
 *
 * Every other check argues from structure. This one breaks the code on purpose
 * and reports the suite that stayed green anyway. There is no arguing with a
 * test that passed while the thing it guards was inverted.
 *
 * Opt-in, because it runs the real test suite N+1 times. Bounded on purpose:
 * a baseline run must pass first, mutations are capped, each run has a timeout,
 * and the file is restored in a finally block plus on SIGINT, so an interrupted
 * scan cannot leave a mutated working tree behind.
 */
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = /\.(m?[jt]s)$/;
const EXCLUDE = /(\.test\.|\.spec\.|\.d\.ts$|\/dist\/|\/node_modules\/|fixture|__)/;

/** Each mutation inverts meaning without changing shape, so nothing fails to parse. */
const MUTATIONS = [
  { find: /(\breturn\s+)true\b/, put: "$1false", label: "return true -> false" },
  { find: /(\breturn\s+)false\b/, put: "$1true", label: "return false -> true" },
  { find: / === /, put: " !== ", label: "=== -> !==" },
  { find: / !== /, put: " === ", label: "!== -> ===" },
  { find: / >= /, put: " < ", label: ">= -> <" },
  { find: / <= /, put: " > ", label: "<= -> >" },
  { find: / && /, put: " || ", label: "&& -> ||" },
];

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function run(root, command, ms) {
  try {
    execSync(command, { cwd: root, stdio: "pipe", timeout: ms, encoding: "utf8" });
    return { passed: true };
  } catch (error) {
    return { passed: false, timedOut: error.signal === "SIGTERM" };
  }
}

/**
 * @param root repository to mutate
 * @param opts.command test command, defaults to the package's own test script
 * @param opts.max how many mutations to try
 * @param opts.timeoutMs per run
 */
export function mutationProof(root, opts = {}) {
  const max = opts.max ?? 4;
  const timeoutMs = opts.timeoutMs ?? 180_000;
  let command = opts.command;
  if (!command) {
    try {
      const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
      if (!pkg.scripts?.test) return [];
      command = "npm test --silent";
    } catch {
      return [];
    }
  }

  // A suite that is already red makes every mutation result meaningless.
  const baseline = run(root, command, timeoutMs);
  if (!baseline.passed) {
    return [
      {
        check: "mutation",
        severity: "low",
        file: ".",
        summary: "mutation testing skipped because the suite does not pass unmutated",
        evidence: `baseline \`${command}\` ${baseline.timedOut ? "timed out" : "failed"}`,
        reproduction: [command],
        proof: { verifiable: false, note: `baseline \`${command}\` did not pass, so nothing was mutated` },
        why: "A mutation only proves something when the suite is green before the mutation. Fix the baseline, then re-run with --mutate.",
      },
    ];
  }

  const candidates = git(root, ["ls-files"])
    .split("\n")
    .filter((f) => SOURCE.test(f) && !EXCLUDE.test(f));

  const findings = [];
  let tried = 0;
  for (const file of candidates) {
    if (tried >= max) break;
    const abs = join(root, file);
    let original;
    try {
      original = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const mutation = MUTATIONS.find((m) => m.find.test(original));
    if (!mutation) continue;

    const mutated = original.replace(mutation.find, mutation.put);
    if (mutated === original) continue;

    const restore = () => {
      try {
        writeFileSync(abs, original);
      } catch {}
    };
    process.once("SIGINT", restore);
    try {
      writeFileSync(abs, mutated);
      tried += 1;
      const after = run(root, command, timeoutMs);
      if (after.passed) {
        findings.push({
          check: "mutation",
          severity: "high",
          file,
          summary: `${file} was mutated (${mutation.label}) and the suite still passed`,
          evidence: `command: ${command}`,
          reproduction: [
            `# apply the same mutation and watch the suite stay green:`,
            `perl -0pi -e 's{${mutation.find.source}}{${mutation.put}}' ${file}`,
            command,
            `git checkout -- ${file}`,
          ],
          // Already established: this finding exists only because the suite was
          // run with the line inverted and passed. Proof mode reports it as
          // observed rather than re-running, which would mutate the tree again.
          proof: { verifiable: false, observed: true, note: `${mutation.label} in ${file}, suite passed under \`${command}\`` },
          why: "No test observes this behaviour. The line can be inverted in production and every gate you own reports success.",
        });
      }
    } finally {
      restore();
      process.removeListener("SIGINT", restore);
    }
  }
  return findings;
}
