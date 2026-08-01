#!/usr/bin/env node
import { resolve } from "node:path";
import { scan } from "./scan.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");

const findings = scan(root);

if (json) {
  process.stdout.write(`${JSON.stringify({ root, findings }, null, 2)}\n`);
  process.exit(findings.length > 0 ? 1 : 0);
}

const C = { r: "[31m", y: "[33m", d: "[2m", b: "[1m", x: "[0m" };
const tint = { high: C.r, medium: C.y, low: C.d };

if (findings.length === 0) {
  console.log(`${C.b}placebo${C.x} ${root}\n\nNothing hollow found. Every check this tool knows how to test held up.`);
  process.exit(0);
}

console.log(`${C.b}placebo${C.x} ${root}\n`);
console.log(`${findings.length} finding${findings.length === 1 ? "" : "s"}, each with a reproduction you can run.\n`);

for (const [i, f] of findings.entries()) {
  const tag = `${tint[f.severity] ?? ""}${f.severity.toUpperCase()}${C.x}`;
  console.log(`${C.b}${i + 1}. ${f.summary}${C.x}`);
  console.log(`   ${tag}  ${C.d}${f.check}${C.x}  ${f.file}`);
  if (f.evidence) console.log(`   ${C.d}${f.evidence}${C.x}`);
  console.log(`   ${C.d}why:${C.x} ${f.why}`);
  console.log(`   ${C.d}reproduce:${C.x}`);
  for (const line of f.reproduction) console.log(`     ${line}`);
  console.log();
}

process.exit(1);
