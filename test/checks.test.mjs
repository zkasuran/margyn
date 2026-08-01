/**
 * Each test builds a real git repository in a temp directory, plants exactly one
 * defect, and asserts the check finds it. Then it plants the fixed version and
 * asserts the check stays quiet. A checker that cannot be shown to go quiet is
 * as useless as the hollow checks it hunts.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ignoredSource } from "../src/checks/ignored-source.mjs";
import { unrunChecks } from "../src/checks/unrun-checks.mjs";
import { scan } from "../src/scan.mjs";

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "placebo-"));
  const run = (...args) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  run("init", "-q");
  run("config", "user.email", "t@example.com");
  run("config", "user.name", "t");
  return {
    dir,
    write(rel, body) {
      const abs = join(dir, rel);
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, body);
    },
    commit() {
      run("add", "-A");
      run("commit", "-q", "-m", "x", "--no-verify");
    },
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("ignored-source catches a file the tests read that git never committed", () => {
  const r = repo();
  try {
    // Exactly the moss shape: the vendored path contains a directory the root
    // .gitignore excludes at any depth.
    r.write(".gitignore", "node_modules/\ndist/\n");
    r.write("scripts/abis.mjs", 'import "../vendor/dist/IPool.mjs";\n');
    r.write("vendor/dist/IPool.mjs", "export const IPool_ABI = [];\n");
    r.commit();

    const found = ignoredSource(r.dir);
    assert.equal(found.length, 1, "expected exactly one finding");
    assert.equal(found[0].check, "ignored-source");
    assert.equal(found[0].file, "vendor/dist/IPool.mjs");
    assert.match(found[0].evidence, /dist\//);
    assert.equal(found[0].referencedBy, "scripts/abis.mjs");
    assert.ok(found[0].reproduction.length >= 1);
  } finally {
    r.cleanup();
  }
});

test("ignored-source stays quiet once the file is committed outside the ignored path", () => {
  const r = repo();
  try {
    r.write(".gitignore", "node_modules/\ndist/\n");
    r.write("scripts/abis.mjs", 'import "../vendor/IPool.mjs";\n');
    r.write("vendor/IPool.mjs", "export const IPool_ABI = [];\n");
    r.commit();

    assert.deepEqual(ignoredSource(r.dir), [], "re-rooted file must not be reported");
  } finally {
    r.cleanup();
  }
});

test("ignored-source ignores an ignored file nothing references", () => {
  const r = repo();
  try {
    r.write(".gitignore", "dist/\n");
    r.write("src/app.mjs", "export const a = 1;\n");
    r.write("dist/app.js", "compiled output nobody reads from source\n");
    r.commit();

    assert.deepEqual(ignoredSource(r.dir), [], "ordinary build output is not a finding");
  } finally {
    r.cleanup();
  }
});

test("unrun-check catches a gate no workflow invokes", () => {
  const r = repo();
  try {
    r.write("package.json", JSON.stringify({
      name: "x",
      scripts: { test: "vitest run", "test:online": "vitest run --config online.ts", build: "tsup" },
    }, null, 2));
    r.write(".github/workflows/ci.yml", "jobs:\n  v:\n    steps:\n      - run: npm run test\n");
    r.commit();

    const found = unrunChecks(r.dir);
    assert.equal(found.length, 1);
    assert.match(found[0].summary, /test:online/);
  } finally {
    r.cleanup();
  }
});

test("unrun-check stays quiet when the workflow runs the gate", () => {
  const r = repo();
  try {
    r.write("package.json", JSON.stringify({ name: "x", scripts: { test: "vitest run" } }, null, 2));
    r.write(".github/workflows/ci.yml", "jobs:\n  v:\n    steps:\n      - run: npm run test\n");
    r.commit();

    assert.deepEqual(unrunChecks(r.dir), []);
  } finally {
    r.cleanup();
  }
});

test("scan drops any finding that arrives without a reproduction", () => {
  const r = repo();
  try {
    r.write("README.md", "clean repo\n");
    r.commit();
    for (const f of scan(r.dir)) assert.ok(f.reproduction?.length, `${f.check} reported without a reproduction`);
  } finally {
    r.cleanup();
  }
});
