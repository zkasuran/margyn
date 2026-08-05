#!/usr/bin/env node
import { resolve } from "node:path";
import { entitled } from "./licence.mjs";
import { scan } from "./scan.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const wantsMutation = args.includes("--mutate");
const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");

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

const findings = scan(root, { mutate });
const C = { r: "[31m", y: "[33m", d: "[2m", b: "[1m", x: "[0m" };
const tint = { high: C.r, medium: C.y, low: C.d };

/**
 * One writer, one shape. `process.exit` is never called: exiting immediately
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
    console.log(`${C.d}Unlock it at https://margyn.xyz, then put the licence in ~/.margyn/licence or MARGYN_LICENCE.${C.x}`);
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
