#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { entitled } from "./licence.mjs";
import { prove } from "./prove.mjs";
import { toMarkdown } from "./report/github.mjs";
import { toSarif } from "./report/sarif.mjs";
import { scan } from "./scan.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const wantsMutation = args.includes("--mutate");
const wantsProve = args.includes("--prove");
const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");

/** Read rather than hardcoded, so a release cannot ship the wrong number. */
function version() {
  try {
    return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
  } catch {
    return "unknown";
  }
}

const USAGE = `margyn ${version()}
Audits the machinery that is supposed to catch your bugs. Every finding ships a
reproduction you can run.

usage: margyn [path] [options]
       npx margyn-scan [path] [options]     (zero install)

  path         repository to scan. Defaults to the current directory
  --mutate     run the mutation proof too. Part of Watch, so it needs a licence
  --prove      run each finding's own proof, certify what reproduces and retract
               what does not, so a gate never fails on a claim it cannot show
  --max=<n>    how many mutations to try. Defaults to 4
  --json       print the findings as JSON instead of text
  --sarif-out=<file>    also write SARIF 2.1.0, for GitHub's Security tab
  --comment-out=<file>  also write a Markdown report, for a PR comment or summary
  --version    print the version
  --help       print this

Exit code is 1 when anything was found, so this works as a CI gate with no
wrapper. A missing licence never exits non-zero: the reason is printed and the
free scan still runs in full.

Documentation: https://margyn.xyz/docs
`;

if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(USAGE);
  process.exit(0);
}
if (args.includes("--version")) {
  process.stdout.write(`${version()}\n`);
  process.exit(0);
}

/**
 * The mutation cap is a real cost knob: each mutation runs the whole suite once.
 * A bad value is refused rather than silently treated as the default, because a
 * typo that quietly scans four files while you believe it scanned forty is the
 * same class of defect this tool reports.
 */
const maxArg = args.find((a) => a.startsWith("--max="));
const max = maxArg ? Number(maxArg.slice("--max=".length)) : undefined;
if (maxArg !== undefined && (!Number.isInteger(max) || max < 1)) {
  console.error(`--max needs a whole number of at least 1, got "${maxArg.slice("--max=".length)}"`);
  process.exit(2);
}

/**
 * The free scan is the whole static suite. The mutation proof is the paid check,
 * because it is the one that costs real machine time: it edits the tree and runs
 * the suite once per mutation. Gating it needs no network, see licence.mjs.
 *
 * A refusal never fails the run. Someone who asked for a paid check and does not
 * hold it still deserves their free findings, and a scan that exits non-zero for
 * a billing reason would break a CI gate for a reason that is not about code.
 */
const licence = wantsMutation ? entitled("watch") : null;
const mutate = wantsMutation && licence.ok;

const findings = scan(root, { mutate, max });
const proven = wantsProve ? prove(root, findings) : null;
const shown = proven ? proven.kept : findings;

/**
 * Extra report files, written alongside the normal output rather than instead of
 * it, so one scan can feed a PR comment, the Security tab and a human at once.
 * A single run keeps the mutation proof from executing more than once.
 */
const sarifOut = (args.find((a) => a.startsWith("--sarif-out=")) ?? "").slice("--sarif-out=".length);
const commentOut = (args.find((a) => a.startsWith("--comment-out=")) ?? "").slice("--comment-out=".length);
if (sarifOut) {
  writeFileSync(sarifOut, `${JSON.stringify(toSarif(shown, { version: version() }), null, 2)}\n`);
}
if (commentOut) {
  writeFileSync(commentOut, `${toMarkdown(shown, { retracted: proven?.retracted, version: version() })}\n`);
}

const C = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const tint = { high: C.r, medium: C.y, low: C.d };

/**
 * One writer, one shape. `process.exit` is never called here: exiting immediately
 * after a write truncates a piped stdout mid-object, which corrupted the JSON
 * at around 64KB. Setting the code lets node flush.
 */
function report() {
  if (asJson) {
    const gate = wantsMutation ? { mutation: mutate ? "unlocked" : "locked", reason: licence.ok ? undefined : licence.reason } : undefined;
    const body = proven
      ? { root, findings: proven.kept, retracted: proven.retracted, proof: proven.tally, gate }
      : { root, findings, gate };
    process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
    return;
  }

  console.log(`${C.b}margyn${C.x} ${root}\n`);

  if (wantsMutation && !mutate) {
    console.log(`${C.y}The mutation proof is part of Watch and it is locked: ${licence.reason}.${C.x}`);
    console.log(`${C.d}Unlock it at https://margyn.xyz/pricing, then put the licence in ~/.margyn/licence or MARGYN_LICENCE.${C.x}`);
    console.log(`${C.d}Everything below is the free scan, which ran in full.${C.x}\n`);
  }

  if (proven) return reportProven();

  if (findings.length === 0) {
    console.log("Nothing hollow found. Every check this tool knows how to test held up.");
    return;
  }

  console.log(`${findings.length} finding${findings.length === 1 ? "" : "s"}, each with a reproduction you can run.\n`);
  for (const [i, f] of findings.entries()) {
    console.log(`${C.b}${i + 1}. ${f.summary}${C.x}`);
    console.log(`   ${tint[f.severity] ?? ""}${f.severity.toUpperCase()}${C.x}  ${C.d}${f.check}${C.x}  ${f.file}`);
    if (f.evidence) console.log(`   ${C.d}${f.evidence}${C.x}`);
    console.log(`   ${C.d}why:${C.x} ${f.why}`);
    console.log(`   ${C.d}reproduce:${C.x}`);
    for (const line of f.reproduction) console.log(`     ${line}`);
    console.log();
  }
}

/**
 * Proof mode output. Each kept finding carries what proving it produced:
 * REPRODUCED with the markers its proof printed, OBSERVED for the mutation proof
 * that was established by running the suite, SHOWN for the few whose evidence a
 * person reads. Retracted findings are listed apart, because withdrawing a
 * finding you cannot reproduce is the whole point of the mode.
 */
function reportProven() {
  const { kept, retracted, tally } = proven;
  if (kept.length === 0 && retracted.length === 0) {
    console.log("Nothing hollow found. Every check this tool knows how to test held up.");
    return;
  }
  const badge = { reproduced: `${C.g}REPRODUCED${C.x}`, observed: `${C.g}OBSERVED${C.x}`, shown: `${C.d}SHOWN${C.x}` };
  for (const [i, f] of kept.entries()) {
    const status = f.proven.status;
    console.log(`${C.b}${i + 1}. ${f.summary}${C.x}`);
    console.log(`   ${tint[f.severity] ?? ""}${f.severity.toUpperCase()}${C.x}  ${C.d}${f.check}${C.x}  ${f.file}  ${badge[status] ?? status}`);
    if (status === "reproduced") {
      for (const line of f.proven.output.split("\n").slice(0, 6)) console.log(`   ${C.d}${line}${C.x}`);
    } else if (status === "observed") {
      console.log(`   ${C.d}${f.proven.note ?? "established by running your suite while scanning"}${C.x}`);
    } else {
      for (const line of f.reproduction) console.log(`     ${line}`);
    }
    console.log();
  }
  if (retracted.length) {
    console.log(`${C.d}Retracted, because the proof did not reproduce on this tree:${C.x}`);
    for (const f of retracted) console.log(`   ${C.d}- ${f.summary} (no ${f.proven.missing.join(", ")})${C.x}`);
    console.log();
  }
  const parts = [`${tally.reproduced} reproduced`];
  if (tally.observed) parts.push(`${tally.observed} observed`);
  if (tally.shown) parts.push(`${tally.shown} shown`);
  if (tally.retracted) parts.push(`${tally.retracted} retracted`);
  console.log(`${tally.total} finding${tally.total === 1 ? "" : "s"}: ${parts.join(", ")}.`);
}

report();
process.exitCode = shown.length > 0 ? 1 : 0;
