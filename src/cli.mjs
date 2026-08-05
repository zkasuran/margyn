#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { entitled } from "./licence.mjs";
import { scan } from "./scan.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const wantsMutation = args.includes("--mutate");
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
  --max=<n>    how many mutations to try. Defaults to 4
  --json       print the findings as JSON instead of text
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
const C = { r: "\x1b[31m", y: "\x1b[33m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const tint = { high: C.r, medium: C.y, low: C.d };

/**
 * One writer, one shape. `process.exit` is never called here: exiting immediately
 * after a write truncates a piped stdout mid-object, which corrupted the JSON
 * at around 64KB. Setting the code lets node flush.
 */
function report() {
  if (asJson) {
    const gate = wantsMutation ? { mutation: mutate ? "unlocked" : "locked", reason: licence.ok ? undefined : licence.reason } : undefined;
    process.stdout.write(`${JSON.stringify({ root, findings, gate }, null, 2)}\n`);
    return;
  }

  console.log(`${C.b}margyn${C.x} ${root}\n`);

  if (wantsMutation && !mutate) {
    console.log(`${C.y}The mutation proof is part of Watch and it is locked: ${licence.reason}.${C.x}`);
    console.log(`${C.d}Unlock it at https://margyn.xyz/pricing, then put the licence in ~/.margyn/licence or MARGYN_LICENCE.${C.x}`);
    console.log(`${C.d}Everything below is the free scan, which ran in full.${C.x}\n`);
  }

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

report();
process.exitCode = findings.length > 0 ? 1 : 0;
