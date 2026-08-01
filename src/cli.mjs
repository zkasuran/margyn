#!/usr/bin/env node
import { resolve } from "node:path";
import { scan } from "./scan.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const mutate = args.includes("--mutate");
const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");

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
    process.stdout.write(`${JSON.stringify({ root, findings }, null, 2)}\n`);
    return;
  }

  console.log(`${C.b}placebo${C.x} ${root}\n`);

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
