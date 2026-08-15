/**
 * The command line is the product. Everything else here is a module test, so
 * these run the real binary as a child process and read what a user reads.
 *
 * Written because our own mutation proof reported src/cli.mjs as unobserved: the
 * suite passed with `findings.length === 0` inverted, which is the branch between
 * "nothing hollow found" and a list of findings. Nothing was watching the exit
 * code either, and that number is the whole CI story on the front page.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cli.mjs");

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "margyn-cli-"));
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

/** Runs the CLI and returns its output plus its exit code, never throwing. */
function margyn(args) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } }) };
  } catch (error) {
    return { code: error.status ?? 1, out: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

/** A repository with exactly one finding: a test that asserts nothing. */
function hollow() {
  const r = repo();
  r.write("package.json", JSON.stringify({ name: "x", scripts: { test: "node --test" } }, null, 2));
  r.write("test/a.test.mjs", [
    'import { test } from "node:test";',
    'test("hollow", () => { const x = compute(); console.log(x); });',
  ].join("\n"));
  r.commit();
  return r;
}

test("the CLI says so plainly on a clean repository and exits 0", () => {
  const r = repo();
  try {
    r.write("README.md", "clean\n");
    r.commit();
    const { code, out } = margyn([r.dir]);
    assert.match(out, /Nothing hollow found/);
    assert.equal(code, 0, "a clean scan must not fail a pipeline");
  } finally {
    r.cleanup();
  }
});

test("the CLI prints the finding, its reproduction and exits 1", () => {
  const r = hollow();
  try {
    const { code, out } = margyn([r.dir]);
    assert.match(out, /1 finding, each with a reproduction you can run/);
    assert.match(out, /asserts nothing/);
    assert.match(out, /reproduce:/);
    assert.match(out, /sed -n/, "the reproduction has to be a command, not a description");
    assert.equal(code, 1, "exit 1 is what makes this a gate with no wrapper");
  } finally {
    r.cleanup();
  }
});

test("--json prints only JSON, so a pipeline can read it", () => {
  const r = hollow();
  try {
    const { code, out } = margyn([r.dir, "--json"]);
    const doc = JSON.parse(out);
    assert.equal(doc.findings.length, 1);
    assert.equal(doc.findings[0].check, "no-assertion");
    assert.ok(doc.root.endsWith(r.dir.split("/").pop()));
    assert.equal(code, 1);
  } finally {
    r.cleanup();
  }
});

test("--prove certifies the finding and says what it ran", () => {
  const r = hollow();
  try {
    const { code, out } = margyn([r.dir, "--prove"]);
    assert.match(out, /REPRODUCED/);
    assert.match(out, /MARGYN_NO_ASSERT_IN_BODY/);
    assert.equal(code, 1);
  } finally {
    r.cleanup();
  }
});

test("--version prints the version this package declares", async () => {
  const { readFileSync } = await import("node:fs");
  const pkg = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
  );
  const { code, out } = margyn(["--version"]);
  assert.equal(out.trim(), pkg.version);
  assert.equal(code, 0);
});

test("a locked mutation proof explains itself and never fails the run", () => {
  const r = repo();
  try {
    r.write("README.md", "clean\n");
    r.commit();
    const { code, out } = margyn([r.dir, "--mutate"]);
    assert.match(out, /locked/, "a missing licence has to say why");
    assert.match(out, /free scan, which ran in full/);
    assert.equal(code, 0, "a missing licence must never be reported as a finding");
  } finally {
    r.cleanup();
  }
});
