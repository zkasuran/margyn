/**
 * Margyn: finds defects in the verification layer, not in the diff.
 *
 * The rule the whole product rests on: a finding is only reported when it
 * carries a reproduction someone else can run. No reproduction, no finding.
 * Zero dependencies on purpose, so a scan can never be blamed on our install.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { shq } from "../shell.mjs";

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

/**
 * Every path suffix that names a file git has.
 *
 * A reader asks for a path, not for a file on your disk. `src="/tour/clip.webm"`
 * is satisfied by `web/public/tour/clip.webm` in the commit, so the build's copy
 * at `web/dist/tour/clip.webm` being untracked proves nothing. Without this,
 * every Vite or Next repository with a build lying around reports its whole
 * public directory as missing source, which is what happened on mpamm.wtf: four
 * HIGH findings, all of them wrong, and the proof passed on every one because it
 * only asked whether that path was committed rather than whether the reference
 * was.
 *
 * Suffixes start at two segments to match the needles below.
 */
function committedSuffixes(tracked) {
  const out = new Set();
  for (const file of tracked) {
    const parts = file.split("/");
    for (let take = 2; take <= parts.length; take += 1) out.add(parts.slice(-take).join("/"));
  }
  return out;
}

/** Escapes a path for use inside a `grep -E` pattern. A slash is not special there. */
const rxq = (s) => s.replace(/[.[\]{}()*+?^$|\\]/g, "\\$&");

/**
 * Build output a tool in this repository declares it writes, keyed off the tool's
 * own configuration rather than off the directory being called dist.
 *
 * Regenerated output is not missing source. It is ignored on purpose, a clean
 * clone rebuilds it, and reporting it is how this check becomes the noise it
 * hunts. Scanned on four real repositories, the naive version reported 22
 * findings and every one of them was a build artefact: puddleswap's forge output
 * under `contracts/out` (declared `out = "out"` in contracts/foundry.toml) and
 * its prerendered `web/dist` (vite), nad-agent's `dist/cli.mjs` (`outdir: "dist"`
 * in scripts/build.mjs) and mpamm's `web/dist`.
 *
 * The name alone is never enough. moss vendored real source into `vendor/dist`,
 * which no tool in that repository declares, and that one is the defect this
 * check exists for. So every path here has to come from a declaration, and it is
 * resolved against the directory that owns the tool: a config's own directory,
 * or for a script the nearest package root, because that is where npm runs it.
 */
const SCRIPT_DEFAULTS = [
  [/\b(vite|astro|tsup|parcel|webpack|rsbuild)\s+build\b/, "dist"],
  [/\bnext\s+build\b/, ".next"],
  [/\bnuxt\s+(build|generate)\b/, ".output"],
  [/\bforge\s+(build|script|test)\b/, "out"],
  [/\bcargo\s+(build|test)\b/, "target"],
  [/\bhardhat\s+compile\b/, "artifacts"],
];
const FLAGS = /--(?:outdir|out-dir|outfile|out|dist-dir|output-dir)[= ]([^\s'"&|;]+)/gi;
const CONFIG_KEYS = /\b(?:outDir|outdir|outfile|distDir|artifacts)\s*:\s*["'`]([^"'`]+)["'`]/g;
const BUILDER = /(?:^|\/)(?:scripts?|tools|bin)\/[^/]*\.[cm]?[jt]s$/i;
const CONFIG_FILE = /(?:^|\/)(?:vite|astro|rollup|webpack|tsup|next|nuxt|svelte|hardhat|rsbuild)\.config\.[cm]?[jt]s$/i;

function declaredOutputs(root, tracked) {
  const out = new Set();
  const dirOf = (file) => (file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : "");
  /** The directory npm would run a script from: the nearest tracked package.json. */
  const packageRoot = (file) => {
    const parts = dirOf(file).split("/").filter(Boolean);
    for (let i = parts.length; i >= 0; i -= 1) {
      const dir = parts.slice(0, i).join("/");
      if (tracked.has(dir ? `${dir}/package.json` : "package.json")) return dir;
    }
    return "";
  };
  const add = (base, value) => {
    const clean = String(value).trim().replace(/^\.\//, "").replace(/\/+$/, "");
    if (!clean || clean === "." || clean.startsWith("/") || clean.startsWith("..")) return;
    out.add(base ? `${base}/${clean}` : clean);
  };

  for (const file of tracked) {
    const name = file.split("/").pop();
    const here = dirOf(file);

    if (name === "package.json") {
      let scripts = {};
      try {
        scripts = JSON.parse(readFileSync(join(root, file), "utf8")).scripts ?? {};
      } catch {
        continue;
      }
      for (const command of Object.values(scripts)) {
        const text = String(command);
        for (const [when, dir] of SCRIPT_DEFAULTS) if (when.test(text)) add(here, dir);
        for (const m of text.matchAll(FLAGS)) add(here, m[1]);
      }
      continue;
    }

    if (name === "foundry.toml") {
      const text = readIfText(root, file) ?? "";
      const declared = text.match(/^\s*out\s*=\s*["']([^"']+)["']/m);
      add(here, declared ? declared[1] : "out");
      continue;
    }

    if (name === "Cargo.toml") {
      add(here, "target");
      continue;
    }

    if (/^tsconfig(\..+)?\.json$/.test(name) || CONFIG_FILE.test(file) || BUILDER.test(file)) {
      const text = readIfText(root, file);
      if (!text) continue;
      for (const m of text.matchAll(CONFIG_KEYS)) add(BUILDER.test(file) ? packageRoot(file) : here, m[1]);
      const json = name.startsWith("tsconfig") ? text.match(/"outDir"\s*:\s*"([^"]+)"/) : null;
      if (json) add(here, json[1]);
    }
  }
  return [...out];
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
  const outputs = declaredOutputs(root, tracked);
  const isOutput = (file) => outputs.some((dir) => file === dir || file.startsWith(`${dir}/`));
  const untracked = present.filter(
    (f) => !tracked.has(f) && !insideFetchedDependency(root, f, tracked) && !isOutput(f),
  );
  if (untracked.length === 0) return [];

  const ignored = new Map();
  for (const file of untracked) {
    const why = git(root, ["check-ignore", "-v", "--", file]).trim();
    if (why) ignored.set(file, why.split("\t")[0]);
  }
  if (ignored.size === 0) return [];

  const readers = [...tracked].filter((f) => READER_EXT.test(f));
  const committed = committedSuffixes(tracked);
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
      // Collect every needle this reader names rather than the first one. If all
      // of them resolve to a file git has, the reference is not broken and there
      // is nothing to report. Report on the shortest one that does not.
      const matched = needles.filter((n) => text.includes(n));
      const broken = matched.find((n) => !committed.has(n));
      if (!broken) continue;
      findings.push({
        check: "ignored-source",
        severity: "high",
        file,
        summary: `${file} is read by ${candidate} but git ignores it, so it is not in the commit`,
        evidence: `ignore rule: ${rule}`,
        reproduction: [
          `git -C . archive HEAD | tar -t | grep -qE '(^|/)${rxq(broken)}$' || echo 'NOTHING in HEAD answers ${broken}'`,
          `test -f '${file}' && echo 'PRESENT on disk: ${file}'`,
        ],
        // Proof mode runs these read-only commands and checks both markers show.
        // The first asks the question that matters: does anything in the commit
        // answer the path the reader asks for. A repository that ships the same
        // asset somewhere else retracts the finding rather than failing a build
        // on a copy of a committed file.
        proof: {
          verifiable: true,
          commands: [
            `git -C . archive HEAD 2>/dev/null | tar -t 2>/dev/null | grep -qE ${shq(`(^|/)${rxq(broken)}$`)} && echo MARGYN_REFERENCE_IN_HEAD || echo MARGYN_REFERENCE_ABSENT_FROM_HEAD`,
            `test -f ${shq(file)} && echo MARGYN_PRESENT_ON_DISK || echo MARGYN_MISSING_ON_DISK`,
          ],
          expect: ["MARGYN_REFERENCE_ABSENT_FROM_HEAD", "MARGYN_PRESENT_ON_DISK"],
        },
        why: "A clean clone or a CI runner cannot read this file. Local runs pass because the file is on your disk and untracked.",
        referencedBy: candidate,
        reference: broken,
      });
      break;
    }
  }
  return findings;
}
