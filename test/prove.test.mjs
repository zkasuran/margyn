/**
 * Proof mode runs each finding's own proof and reports what happened. These
 * tests build a real git repository, let the checks produce real findings, then
 * assert proof mode certifies the ones it can reproduce and retracts the ones it
 * cannot. The retraction path is the point: a checker that will not withdraw a
 * finding it cannot reproduce is exactly the hollow gate this tool hunts.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { scan } from "../src/scan.mjs";
import { prove, proveFinding } from "../src/prove.mjs";

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "margyn-prove-"));
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

test("proof mode certifies a real ignored-source finding by running its proof", () => {
  const r = repo();
  try {
    r.write(".gitignore", "node_modules/\ndist/\n");
    r.write("scripts/abis.mjs", 'import "../vendor/dist/IPool.mjs";\n');
    r.write("vendor/dist/IPool.mjs", "export const IPool_ABI = [];\n");
    r.commit();

    const { kept, retracted, tally } = prove(r.dir, scan(r.dir));
    const f = kept.find((x) => x.check === "ignored-source");
    assert.ok(f, "the ignored-source finding must survive proof");
    assert.equal(f.proven.status, "reproduced");
    assert.match(f.proven.output, /MARGYN_REFERENCE_ABSENT_FROM_HEAD/);
    assert.match(f.proven.output, /MARGYN_PRESENT_ON_DISK/);
    assert.equal(retracted.length, 0);
    assert.equal(tally.reproduced, 1);
  } finally {
    r.cleanup();
  }
});

test("proof mode reproduces a no-assertion finding by re-reading the body", () => {
  const r = repo();
  try {
    r.write("test/a.test.mjs", [
      'import { test } from "node:test";',
      'test("hollow", () => { const x = compute(); console.log(x); });',
    ].join("\n"));
    r.commit();

    const { kept } = prove(r.dir, scan(r.dir));
    const f = kept.find((x) => x.check === "no-assertion");
    assert.ok(f, "the no-assertion finding must survive proof");
    assert.equal(f.proven.status, "reproduced");
    assert.match(f.proven.output, /MARGYN_NO_ASSERT_IN_BODY/);
  } finally {
    r.cleanup();
  }
});

test("proof mode retracts a verifiable finding whose proof does not reproduce", () => {
  const fake = [{
    check: "invented",
    severity: "high",
    file: ".",
    summary: "claims a marker that never prints",
    reproduction: ["echo nothing"],
    proof: { verifiable: true, commands: ["echo present"], expect: ["MARGYN_NEVER_PRINTED"] },
  }];
  const { kept, retracted, tally } = prove(process.cwd(), fake);
  assert.equal(kept.length, 0, "an unreproducible finding must not survive to fail a gate");
  assert.equal(retracted.length, 1);
  assert.equal(retracted[0].proven.status, "retracted");
  assert.deepEqual(retracted[0].proven.missing, ["MARGYN_NEVER_PRINTED"]);
  assert.equal(tally.retracted, 1);
});

test("proof mode retracts a no-assertion claim against a body that does assert", () => {
  const r = repo();
  try {
    r.write("test/real.test.mjs", 'import assert from "node:assert";\nassert.equal(1, 1);\n');
    r.commit();
    // A finding shaped exactly like no-assertion's, but pointed at a line that
    // asserts. The proof re-greps the body, finds the assertion, and withdraws.
    const claim = [{
      check: "no-assertion",
      severity: "high",
      file: "test/real.test.mjs:2",
      summary: 'test "real" asserts nothing',
      reproduction: ["read it"],
      proof: {
        verifiable: true,
        commands: [
          "sed -n '2,2p' 'test/real.test.mjs' | grep -Eq '(expect|assert)' && echo MARGYN_HAS_ASSERT || echo MARGYN_NO_ASSERT_IN_BODY",
        ],
        expect: ["MARGYN_NO_ASSERT_IN_BODY"],
      },
    }];
    const { kept, retracted } = prove(r.dir, claim);
    assert.equal(kept.length, 0);
    assert.equal(retracted.length, 1, "a false no-assertion claim must be withdrawn");
  } finally {
    r.cleanup();
  }
});

test("proof mode reports the mutation finding as observed, without re-running it", () => {
  const finding = {
    check: "mutation",
    severity: "high",
    file: "src/a.mjs",
    summary: "src/a.mjs was mutated and the suite still passed",
    reproduction: ["would mutate and run the suite"],
    proof: { verifiable: false, observed: true, note: "suite passed under the mutation" },
  };
  const proven = proveFinding("/nonexistent-should-not-be-touched", finding);
  assert.equal(proven.proven.status, "observed");
  assert.equal(proven.proven.output, "", "an observed finding runs no command");
});

test("proof mode over a clean repository reports nothing", () => {
  const r = repo();
  try {
    r.write("README.md", "clean\n");
    r.commit();
    const { kept, retracted, tally } = prove(r.dir, scan(r.dir));
    assert.equal(kept.length, 0);
    assert.equal(retracted.length, 0);
    assert.equal(tally.total, 0);
  } finally {
    r.cleanup();
  }
});
