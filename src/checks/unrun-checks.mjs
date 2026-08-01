/**
 * CHECK 2: checks that are declared and never run.
 *
 * A script sitting in package.json that no workflow invokes and no other script
 * calls is a check everybody believes is enforced and nothing enforces. This is
 * the gap pillowtalk-Qy raised on moss #67: a package can declare a suite that
 * is only discovered after merge, or never at all.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** npm runs these itself, so absence from CI proves nothing. */
const LIFECYCLE = new Set([
  "preinstall", "install", "postinstall", "prepare", "prepublishOnly", "prepack",
  "postpack", "dev", "start", "predev", "prestart",
]);

function workflowText(root) {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) return "";
  let text = "";
  for (const f of readdirSync(dir)) {
    if (!/\.ya?ml$/i.test(f)) continue;
    try { text += readFileSync(join(dir, f), "utf8") + "\n"; } catch {}
  }
  return text;
}

function packageJsons(root) {
  const out = [];
  const roots = [root];
  for (const wsDir of ["packages", "apps", "examples"]) {
    const abs = join(root, wsDir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs)) {
      roots.push(join(abs, name));
      const nested = join(abs, name);
      for (const sub of (() => { try { return readdirSync(nested); } catch { return []; } })()) {
        roots.push(join(nested, sub));
      }
    }
  }
  for (const dir of roots) {
    const p = join(dir, "package.json");
    if (!existsSync(p)) continue;
    try { out.push({ path: p, json: JSON.parse(readFileSync(p, "utf8")) }); } catch {}
  }
  return out;
}

export function unrunChecks(root) {
  const ci = workflowText(root);
  if (!ci) return [];
  const pkgs = packageJsons(root);
  const findings = [];

  for (const { path, json } of pkgs) {
    const scripts = json.scripts ?? {};
    const allScriptBodies = Object.values(scripts).join("\n");
    for (const [name, body] of Object.entries(scripts)) {
      if (LIFECYCLE.has(name)) continue;
      // Only flag scripts that look like a gate. A build or codegen script that
      // nothing calls is a different conversation.
      if (!/^(test|lint|typecheck|check|verify|audit|e2e)/i.test(name)) continue;
      const calledByCi = ci.includes(name);
      // A sibling calls it however the package manager spells it: `pnpm check:web`,
      // `npm run check:web`, `turbo run check:web`. Any mention in another
      // script's body counts, which is why the name is matched bare.
      const peers = Object.entries(scripts).filter(([n]) => n !== name).map(([, b]) => b).join("\n");
      const calledByPeer = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(peers);
      if (calledByCi || calledByPeer) continue;
      findings.push({
        check: "unrun-check",
        severity: "medium",
        file: path.replace(root + "/", ""),
        summary: `script "${name}" is declared but no workflow or sibling script runs it`,
        evidence: `${name}: ${body}`,
        reproduction: [
          `grep -R '${name}' .github/workflows/ || echo 'NOT referenced by any workflow'`,
          `npm run ${name} --prefix $(dirname ${path.replace(root + "/", "")})`,
        ],
        why: "A gate nobody invokes cannot fail. It reads as coverage in the repository and contributes none.",
      });
    }
  }
  return findings;
}
