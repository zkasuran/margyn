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
import { prove } from "../src/prove.mjs";
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

test("ignored-source stays quiet when the commit answers the path the reader asks for", () => {
  const r = repo();
  try {
    // The mpamm.wtf shape, which this check got wrong: a Vite app referencing an
    // asset by its served URL, with the committed copy under public/ and a build
    // lying around in dist/. The reference resolves in a clean clone, so there is
    // no finding, whatever the build left on this disk.
    r.write(".gitignore", "node_modules/\ndist/\n");
    r.write("web/src/Tour.tsx", "const clips = [{ src: '/tour/clip.webm' }];\nexport default clips;\n");
    r.write("web/public/tour/clip.webm", "committed asset\n");
    r.commit();
    r.write("web/dist/tour/clip.webm", "the build's copy of it\n");

    assert.deepEqual(ignoredSource(r.dir), [], "a built copy of a committed asset is not missing source");
  } finally {
    r.cleanup();
  }
});

test("ignored-source still reports the path a reader names that nothing commits", () => {
  const r = repo();
  try {
    // Same repository, except the reader names the build directory itself. That
    // path is in no commit, so a clean clone cannot read it and the finding
    // stands. The reference it reports is the path that is actually broken.
    r.write(".gitignore", "node_modules/\ndist/\n");
    r.write("web/src/Tour.tsx", "const clip = 'web/dist/tour/clip.webm';\nexport default clip;\n");
    r.write("web/public/tour/clip.webm", "committed asset\n");
    r.commit();
    r.write("web/dist/tour/clip.webm", "the build's copy of it\n");

    const found = ignoredSource(r.dir);
    assert.equal(found.length, 1, "expected exactly one finding");
    assert.equal(found[0].file, "web/dist/tour/clip.webm");
    assert.equal(found[0].reference, "dist/tour/clip.webm");
    assert.ok(found[0].proof.commands[0].includes("dist/tour/clip\\.webm"), "the proof asks about the reference");
  } finally {
    r.cleanup();
  }
});

test("ignored-source leaves build output a tool in the repo declares it writes", () => {
  const r = repo();
  try {
    // puddleswap's shape: forge declares `out` in its own toml, a script reads
    // the artefacts it produces, and the whole directory is ignored on purpose.
    // A clean clone plus `forge build` has these files, so they are not missing
    // source and reporting them is the noise this check exists to remove.
    r.write(".gitignore", "node_modules/\ncontracts/out/\n");
    r.write("contracts/foundry.toml", '[profile.default]\nsrc = "src"\nout = "out"\n');
    r.write("scripts/sync.mjs", 'const abi = "contracts/out/Pool.sol/Pool.json";\nexport default abi;\n');
    r.commit();
    r.write("contracts/out/Pool.sol/Pool.json", '{"abi":[]}\n');

    assert.deepEqual(ignoredSource(r.dir), [], "declared build output is not a finding");
  } finally {
    r.cleanup();
  }
});

test("ignored-source still reports vendored source under a path that only looks built", () => {
  const r = repo();
  try {
    // The moss defect, in a repository that also has a real build writing to
    // dist. The declared output is `dist` at the root. `vendor/dist` is a
    // different path that no tool declares, so the vendored module stays a
    // finding. A rule keyed on the directory being called dist would lose this.
    r.write(".gitignore", "node_modules/\ndist/\n");
    r.write("package.json", JSON.stringify({ name: "x", scripts: { build: "vite build" } }, null, 2));
    r.write("scripts/abis.mjs", 'import "../vendor/dist/IPool.mjs";\n');
    r.write("vendor/dist/IPool.mjs", "export const IPool_ABI = [];\n");
    r.write("dist/app.js", "the build's own output, ignored and rebuilt\n");
    r.commit();

    const found = ignoredSource(r.dir);
    assert.equal(found.length, 1, "expected exactly the vendored file");
    assert.equal(found[0].file, "vendor/dist/IPool.mjs");
  } finally {
    r.cleanup();
  }
});

test("ignored-source leaves a dependency tree an install step fetches", () => {
  const r = repo();
  try {
    // forge install writes into contracts/lib and the whole directory is ignored.
    // The signal is a manifest of its own inside an untracked ancestor, so a clean
    // clone plus `forge install` has the file and reporting it is noise. Our own
    // mutation proof named this suppression as unobserved, which is how a rule
    // this check depends on can be inverted with every gate still green.
    r.write(".gitignore", "node_modules/\ncontracts/lib/\n");
    r.write("contracts/src/Pool.sol", 'import "lib/forge-std/src/Test.sol";\n');
    r.commit();
    r.write("contracts/lib/forge-std/package.json", '{"name":"forge-std"}\n');
    r.write("contracts/lib/forge-std/src/Test.sol", "contract Test {}\n");

    assert.deepEqual(ignoredSource(r.dir), [], "a fetched dependency is not missing source");
  } finally {
    r.cleanup();
  }
});

test("unrun-check stays quiet when a sibling script is the thing that runs it", () => {
  const r = repo();
  try {
    // `verify` is never named in a workflow. It is not unrun: `test` calls it, and
    // CI calls `test`. Our own mutation proof reported the line that excludes the
    // script from its own peer list as unobserved, and with that line inverted this
    // repository reports a gate that a sibling plainly runs.
    r.write("package.json", JSON.stringify({
      name: "x",
      scripts: { test: "npm run verify && node --test", verify: "node scripts/gate.mjs" },
    }, null, 2));
    r.write(".github/workflows/ci.yml", "jobs:\n  v:\n    steps:\n      - run: npm test\n");
    r.commit();

    assert.deepEqual(unrunChecks(r.dir), [], "a gate a sibling script runs is not unrun");
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

test("no-assertion spares a planned count and a helper handed the context", () => {
  const r = repo();
  try {
    // All three shapes were found on fastify at 39e87e8. The first two were
    // reported and were wrong, which is what this test exists to keep fixed.
    r.write("test/b.test.mjs", [
      'import { test } from "node:test";',
      'test("planned, with a comma in the title", async t => {',
      "  t.plan(2)",
      "  const app = build({ trustProxy: true })",
      "  app.get('/x', (req, reply) => reply.code(200).send({ ip: req.ip }))",
      "  await app.listen({ port: 0 })",
      "});",
      'test("helper holds the assertion", async t => {',
      "  const app = build({ trustProxy: true })",
      "  checkRequestValues(t, app, { ip: '1.1.1.1', port: 1234 })",
      "  await app.listen({ port: 0 })",
      "});",
      'test("really hollow", async t => {',
      "  const app = build({ trustProxy: true })",
      "  console.log(t)",
      "  await app.listen({ port: 0 })",
      "});",
    ].join("\n"));
    r.commit();

    const found = noAssertion(r.dir);
    assert.equal(found.length, 1, `only the hollow test is a finding, got ${found.map((f) => f.summary).join(" | ")}`);
    assert.match(found[0].summary, /"really hollow"/);
    assert.match(found[0].summary, /nothing but a thrown error/);
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
    // The label is the whole sentence a reader gets: "was mutated (X -> Y)". It
    // has to name the change that was actually applied, and the only thing
    // watching it is this line. Our own mutation proof made the point by editing
    // that label to read "return false -> false" with the suite still green.
    assert.match(found[0].summary, /\(return true -> false\)/, "the label must describe the real change");
    assert.match(found[0].reproduction.join("\n"), /return\\s\+\)true/, "the reproduction applies the same mutation");
    assert.equal(readFileSync(join(r.dir, "src/a.mjs"), "utf8"), before, "the file must be restored");
  } finally {
    r.cleanup();
  }
});

test("no-assertion is not fooled by the word should in the test title", () => {
  const r = repo();
  try {
    // fastify's wrap-thenable.test.js shape. The loose assertion matcher read the
    // word "should" in the title as an assertion, so this whole class went
    // unreported until comments, strings and titles stopped being matched. The
    // proof command had the same fault, which is how it was found: the finding
    // appeared and its own proof retracted it.
    r.write("test/a.test.mjs", [
      'import { test } from "node:test";',
      'test("should resolve immediately when the reply is hijacked", async () => {',
      "  await new Promise((resolve) => { const reply = {}; hijack(reply); resolve(); });",
      "});",
    ].join("\n"));
    r.commit();

    const found = noAssertion(r.dir);
    assert.equal(found.length, 1, "a title is not an assertion");
    const proven = prove(r.dir, found);
    assert.equal(proven.kept.length, 1, "the proof has to agree with the check");
    assert.equal(proven.kept[0].proven.status, "reproduced");
  } finally {
    r.cleanup();
  }
});
