/**
 * CHECK 3: linter and formatter ignore rules that skip tracked source.
 *
 * The second half of the moss failure on 2026-08-01. Biome was configured with
 * `vcs.useIgnoreFile`, so the vendored files it should never touch were skipped
 * only because .gitignore happened to hide them. Nothing in the linter config
 * said so. The moment the files became tracked, the linter started rewriting
 * third-party bytes whose sha256 was the thing proving they were upstream's.
 *
 * Generalised: any tool whose exclusion depends on the ignore file rather than
 * its own config is one commit away from changing behaviour silently.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONFIGS = [
  { file: "biome.json", tool: "biome" },
  { file: "biome.jsonc", tool: "biome" },
  { file: ".eslintrc.json", tool: "eslint" },
  { file: "eslint.config.js", tool: "eslint" },
  { file: ".prettierrc", tool: "prettier" },
];

export function lintBlindspots(root) {
  const findings = [];
  for (const { file, tool } of CONFIGS) {
    const abs = join(root, file);
    if (!existsSync(abs)) continue;
    let raw;
    try { raw = readFileSync(abs, "utf8"); } catch { continue; }

    const usesIgnoreFile = /"useIgnoreFile"\s*:\s*true/.test(raw) || /ignorePath/.test(raw);
    if (!usesIgnoreFile) continue;

    findings.push({
      check: "lint-blindspot",
      severity: "medium",
      file,
      summary: `${tool} inherits its exclusions from the ignore file, so its coverage changes when .gitignore changes`,
      evidence: `${file} sets the ignore-file option, and its own exclude list is the only durable record of what must not be touched`,
      reproduction: [
        `# make a currently ignored path tracked, then re-run the linter:`,
        `${tool} check . 2>&1 | head -20`,
        `# any file that newly appears was excluded by .gitignore, not by ${file}`,
      ],
      why: "Exclusions that live in .gitignore are a side effect. A path that becomes tracked silently enters the tool's scope, which can rewrite vendored bytes or start failing a gate nobody changed.",
    });
  }
  return findings;
}
