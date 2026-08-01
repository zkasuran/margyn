/**
 * Placebo: finds defects in the verification layer, not in the diff.
 *
 * The rule the whole product rests on: a finding is only reported when it
 * carries a reproduction someone else can run. No reproduction, no finding.
 * Zero dependencies on purpose, so a scan can never be blamed on our install.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules", ".next", "target", "venv", ".venv", "__pycache__"]);
const TEXT_EXT = /\.(m?[jt]sx?|json|jsonc|ya?ml|toml|md|sol|py|rs|go|rb|sh|cfg|ini|txt)$/i;
const MAX_BYTES = 400_000;

function git(cwd, args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

/** Every file present on disk, minus the directories nobody means to ship. */
function walk(root, dir = root, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(root, abs, out);
    else if (entry.isFile()) out.push(relative(root, abs).split(sep).join("/"));
  }
  return out;
}

/**
 * True when the file sits inside a dependency tree that some install step
 * fetches: `forge install` into contracts/lib, an npm fetch into a generation
 * directory. Those paths are ignored on purpose and recreated on demand, so a
 * clean clone is fine. The signal is a manifest of its own inside an ancestor
 * that git also does not track.
 */
const MANIFESTS = ["package.json", "foundry.toml", "Cargo.toml", "go.mod", ".git"];
function insideFetchedDependency(root, file, tracked) {
  const parts = file.split("/");
  for (let i = parts.length - 1; i > 0; i -= 1) {
    const dir = parts.slice(0, i).join("/");
    for (const manifest of MANIFESTS) {
      const candidate = `${dir}/${manifest}`;
      if (tracked.has(candidate)) continue;
      if (existsSync(join(root, candidate))) return true;
    }
  }
  return false;
}

function trackedFiles(root) {
  return new Set(git(root, ["ls-files"]).split("\n").filter(Boolean));
}

/** Reads a tracked text file, skipping anything too big to be a reference site. */
function readIfText(root, file) {
  if (!TEXT_EXT.test(file)) return null;
  const abs = join(root, file);
  try {
    if (statSync(abs).size > MAX_BYTES) return null;
    return readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

/**
 * A package declaring its own build output in `package.json` (`main`, `exports`,
 * `bin`) is not a defect: that output is meant to be ignored and rebuilt. So a
 * mention only counts when it comes from code that READS the file, and the file
 * must not itself look like build output. Without both rules this check reports
 * every `dist/` entry in every monorepo and becomes the thing it hunts.
 */
const READER_EXT = /\.(m?[jt]sx?|sol|py|rs|go|rb|sh)$/i;

/**
 * CHECK 1: source the repository reads but git never committed.
 *
 * This is the defect that made a moss PR go red on 2026-08-01: eight vendored
 * modules lived under a path containing `dist/`, the root `.gitignore` ignores
 * `dist/` at any depth, so every one was silently dropped from the commit. The
 * local run was green because the files were sitting there untracked. CI read
 * paths that had never been pushed.
 */
export function ignoredSource(root) {
  const tracked = trackedFiles(root);
  if (tracked.size === 0) return [];
  const present = walk(root);
  const untracked = present.filter((f) => !tracked.has(f) && !insideFetchedDependency(root, f, tracked));
  if (untracked.length === 0) return [];

  const ignored = new Map();
  for (const file of untracked) {
    const why = git(root, ["check-ignore", "-v", "--", file]).trim();
    if (why) ignored.set(file, why.split("\t")[0]);
  }
  if (ignored.size === 0) return [];

  const readers = [...tracked].filter((f) => READER_EXT.test(f));
  const findings = [];
  for (const [file, rule] of ignored) {
    // Match on a path suffix carrying at least one parent directory. A bare
    // basename is useless here: every package has a dist/index.js, so matching
    // "index.js" reports the whole monorepo. The real moss defect was found by
    // its 3-segment path, "dist/abis/IPool.mjs", which this still catches.
    const parts = file.split("/");
    const needles = [];
    for (let take = 2; take <= parts.length; take += 1) needles.push(parts.slice(-take).join("/"));
    for (const candidate of readers) {
      const text = readIfText(root, candidate);
      if (!text) continue;
      if (!needles.some((n) => text.includes(n))) continue;
      findings.push({
        check: "ignored-source",
        severity: "high",
        file,
        summary: `${file} is read by ${candidate} but git ignores it, so it is not in the commit`,
        evidence: `ignore rule: ${rule}`,
        reproduction: [
          `git -C . archive HEAD | tar -t | grep -qx '${file}' || echo 'ABSENT from HEAD: ${file}'`,
          `test -f '${file}' && echo 'PRESENT on disk: ${file}'`,
        ],
        why: "A clean clone or a CI runner cannot read this file. Local runs pass because the file is on your disk and untracked.",
        referencedBy: candidate,
      });
      break;
    }
  }
  return findings;
}
