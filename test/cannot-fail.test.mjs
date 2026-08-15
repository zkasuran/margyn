/**
 * cannot-fail, both directions.
 *
 * Every rule here was measured on real repositories before it shipped, and the
 * shapes that are deliberately NOT reported have tests too. Those are the ones
 * that matter: this check fired 41 times on fastify in its first draft and 39 of
 * those were wrong, so each suppression below is a defect that was fixed rather
 * than a preference.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cannotFail } from "../src/checks/cannot-fail.mjs";

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "margyn-cf-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git("init", "-q");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  return {
    dir,
    write(rel, body) {
      const abs = join(dir, rel);
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, body);
    },
    commit() {
      git("add", "-A");
      git("commit", "-q", "-m", "x", "--no-verify");
    },
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** Writes one test file, commits, scans, returns the findings. */
function scanOne(body) {
  const r = repo();
  try {
    r.write("test/a.test.mjs", body);
    r.commit();
    return cannotFail(r.dir);
  } finally {
    r.cleanup();
  }
}

test("a test whose only assertion is on a literal is reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("documents that the handler exists", () => {',
    "  // the handler registration is tested by reading it",
    "  expect(true).toBe(true);",
    "});",
  ].join("\n"));
  assert.equal(found.length, 1);
  assert.equal(found[0].check, "cannot-fail");
  assert.equal(found[0].severity, "high");
  assert.match(found[0].summary, /one assertion and it is on a literal/);
  assert.match(found[0].file, /test\/a\.test\.mjs:4$/);
  assert.ok(found[0].proof.commands.length >= 1);
});

test("a literal assertion answering a caught error is reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("returns 401 without a token", async () => {',
    "  try {",
    "    const res = await fetch(url);",
    "    expect(res.status).toBe(401);",
    "  } catch (error) {",
    "    expect(true).toBe(true);",
    "  }",
    "});",
  ].join("\n"));
  assert.equal(found.length, 1, "the catch turns the failing assertion into a pass");
  assert.match(found[0].summary, /answers a caught error/);
});

test("an assertion inside a try whose catch does nothing is reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("app is reachable", async () => {',
    "  try {",
    "    const res = await fetch(url);",
    "    expect(res.status).toBeLessThan(500);",
    "  } catch (err) {",
    "    console.warn(\"not reachable\");",
    "  }",
    "});",
  ].join("\n"));
  assert.equal(found.length, 1, "the assertion is swallowed, so the test passes with the app down");
  assert.match(found[0].summary, /swallowed/);
});

test("a fail marker whose catch only checks that an error arrived is reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("rejects bad input", async () => {',
    "  try {",
    "    await call(bad);",
    "    expect(true).to.be.false;",
    "  } catch (error) {",
    "    expect(error).to.exist;",
    "  }",
    "});",
  ].join("\n"));
  assert.equal(found.length, 1, "the marker's own AssertionError satisfies the catch");
  assert.match(found[0].summary, /fail marker/);
});

test("a status list spanning success and failure is reported, one class is not", () => {
  const mixed = scanOne([
    'import { test } from "node:test";',
    'test("endpoint answers", async () => {',
    "  const res = await fetch(url);",
    "  expect([200, 302, 400]).toContain(res.status);",
    "});",
  ].join("\n"));
  assert.equal(mixed.length, 1);
  assert.equal(mixed[0].severity, "medium");
  assert.match(mixed[0].summary, /accepts 200, 302 and 400/);

  const oneClass = scanOne([
    'import { test } from "node:test";',
    'test("endpoint rejects", async () => {',
    "  const res = await fetch(url);",
    "  expect([400, 401, 403]).toContain(res.status);",
    "});",
  ].join("\n"));
  assert.deepEqual(oneClass, [], "a list of failure codes is a deliberate negative test");
});

/* The suppressions. Each one is a false positive this check produced on a real
   repository before it shipped. */

test("a declared assertion count is not reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("throws on a duplicate route", (t) => {',
    "  t.plan(1);",
    "  try {",
    "    register();",
    "    t.assert.fail();",
    "  } catch (e) {",
    "    t.assert.ok(true);",
    "  }",
    "});",
  ].join("\n"));
  assert.deepEqual(found, [], "the plan counts the assertions each path makes, so it can go red");
});

test("a literal assertion alongside a real one is not reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("does not mutate the options object", (t) => {',
    "  try {",
    "    build(frozen);",
    "    t.assert.ok(true);",
    "  } catch (error) {",
    "    t.assert.fail(error.message);",
    "  }",
    "});",
  ].join("\n"));
  assert.deepEqual(found, [], "the catch fails the test, so the marker in the try is not the only check");
});

test("a catch that captures the error for a later assertion is not reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("rejects a private address", async () => {',
    "  let thrown;",
    "  try {",
    "    await assertUrlIsPublic(url);",
    "  } catch (err) {",
    "    thrown = err;",
    "  }",
    "  expect(thrown).toBeInstanceOf(BlockedError);",
    "});",
  ].join("\n"));
  assert.deepEqual(found, [], "the standard way to assert on a rejection is correct");
});

test("a catch that checks which error arrived is not reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("throws a duplicated route error", () => {',
    "  try {",
    "    register();",
    "    expect.fail();",
    "  } catch (error) {",
    '    expect(error.code).toBe("ERR_DUPLICATED_ROUTE");',
    "  }",
    "});",
  ].join("\n"));
  assert.deepEqual(found, [], "an assertion on the error's code separates it from the marker's own");
});

test("vacuous code inside a string is not reported", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'test("compiles a catch block", () => {',
    '  expect(output).toContain("}catch(e){}");',
    '  expect(output).toContain("expect(true).toBe(true)");',
    "});",
  ].join("\n"));
  assert.deepEqual(found, [], "comments and string contents are blanked before matching");
});

test("a clean test file reports nothing", () => {
  const found = scanOne([
    'import { test } from "node:test";',
    'import assert from "node:assert/strict";',
    'test("adds", () => { assert.equal(add(2, 2), 4); });',
  ].join("\n"));
  assert.deepEqual(found, []);
});
