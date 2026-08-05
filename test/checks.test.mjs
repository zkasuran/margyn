/**
 * Each test builds a real git repository in a temp directory, plants exactly one
 * defect, and asserts the check finds it. Then it plants the fixed version and
 * asserts the check stays quiet. A checker that cannot be shown to go quiet is
 * as useless as the hollow checks it hunts.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ignoredSource } from "../src/checks/ignored-source.mjs";
import { mutationProof } from "../src/checks/mutation.mjs";
import { noAssertion } from "../src/checks/no-assertion.mjs";
import { unrunChecks } from "../src/checks/unrun-checks.mjs";
import { scan } from "../src/scan.mjs";

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "margyn-"));
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

test("no-assertion catches a test that checks nothing and spares one that does", () => {
  const r = repo();
  try {
    r.write("test/a.test.mjs", [
      'import { test } from "node:test";',
      'import assert from "node:assert";',
      'test("real", () => { assert.equal(1, 1); });',
      'test("hollow", () => { const x = compute(); console.log(x); });',
    ].join("\n"));
    r.commit();

    const found = noAssertion(r.dir);
    assert.equal(found.length, 1, "only the assertionless test is a finding");
    assert.match(found[0].summary, /"hollow"/);
    assert.equal(found[0].severity, "high");
  } finally {
    r.cleanup();
  }
});

test("no-assertion leaves a compile-time fixture alone", () => {
  const r = repo();
  try {
    r.write("test/types.test.ts", [
      'test("rejects a bad call", () => {',
      '  // @ts-expect-error wrong arity',
      '  build(1, 2, 3);',
      '});',
    ].join("\n"));
    r.commit();

    assert.deepEqual(noAssertion(r.dir), [], "a type fixture has nothing to assert at runtime");
  } finally {
    r.cleanup();
  }
});

test("mutation refuses to draw conclusions from a red baseline", () => {
  const r = repo();
  try {
    r.write("package.json", JSON.stringify({ name: "x", scripts: { test: "exit 1" } }, null, 2));
    r.write("src/a.mjs", "export const ok = () => { return true; };\n");
    r.commit();

    const found = mutationProof(r.dir, { command: "exit 1", max: 1, timeoutMs: 20_000 });
    assert.equal(found.length, 1);
    assert.equal(found[0].check, "mutation");
    assert.match(found[0].summary, /skipped/);
  } finally {
    r.cleanup();
  }
});

test("mutation reports a line no test observes, and restores the file", () => {
  const r = repo();
  try {
    r.write("src/a.mjs", "export const ok = () => { return true; };\n");
    // A suite that passes without ever calling ok(), so mutating it changes nothing.
    r.write("run-tests.mjs", 'process.exit(0);\n');
    r.commit();
    const before = readFileSync(join(r.dir, "src/a.mjs"), "utf8");

    const found = mutationProof(r.dir, { command: "node run-tests.mjs", max: 1, timeoutMs: 20_000 });
    assert.equal(found.length, 1, "the unobserved mutation must be reported");
    assert.match(found[0].summary, /still passed/);
    assert.equal(readFileSync(join(r.dir, "src/a.mjs"), "utf8"), before, "the file must be restored");
  } finally {
    r.cleanup();
  }
});
