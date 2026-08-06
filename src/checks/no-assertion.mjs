/**
 * CHECK 4: tests that cannot fail because they assert nothing.
 *
 * A test body with no assertion runs the code, throws nothing, and reports
 * green forever. It reads as coverage in the repository and proves only that
 * the code did not crash. Deterministic to detect, so it needs no mutation run.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const TEST_FILE = /\.(test|spec)\.[mc]?[jt]sx?$/;
// Helpers are the common case: a test whose whole body is `expectTreeError(...)`
// does assert, the assertion just lives one call away. Any identifier containing
// expect or assert counts, which is why this matches loosely on purpose.
const ASSERT = /\b(expect|assert)\b|\b\w*(expect|assert)\w*\s*\(|\b(should|chai)\b|\bt\.(ok|is|deepEqual|throws)\b|\.to\.|\.toBe|\.toEqual|\.toThrow|\.rejects\b|\.resolves\b/i;
/**
 * A declared assertion count is an assertion. `t.plan(11)` fails the test when
 * the count comes up short, in node:test, tap, tape and ava alike, so a body
 * carrying one cannot be hollow.
 *
 * Found by running this check over fastify at 39e87e8: seven tests in
 * test/trust-proxy.test.js were reported and every one of them planned its
 * assertions, so all seven were false positives.
 */
const PLAN = /\bplan\s*\(\s*\d+\s*\)/;
/** A test that only exists to pin types has nothing to assert at runtime. */
const TYPE_ONLY = /@ts-expect-error|expectTypeOf|assertType|satisfies /;
/** Calls that take the context without asserting through it. */
const NOT_ASSERTING = /^(console|log|print|process)$/;

/**
 * The name the test callback gave its context, `t` in `async t => { ... }`.
 *
 * Read from the span rather than parsed. The search has to survive a title with a
 * comma in it, which is why it scans commas until one is followed by something
 * that looks like a callback head.
 */
function contextName(span) {
  const m = span.match(
    /,\s*(?:\{[\s\S]*?\}\s*,\s*)?(?:async\s+)?(?:function\s*[\w$]*\s*)?\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*(?:=>|\{)/,
  );
  return m ? m[1] : null;
}

/**
 * True when a helper is handed the test context. That is the same rule this
 * check already applies to a helper whose name says assert, made general: the
 * assertion lives in the helper and the helper needs the context to make it.
 * fastify's `testRequestValues(t, req, {...})` asserts eleven times.
 */
function helperAsserts(span, ctx) {
  if (!ctx) return false;
  for (const [, name] of span.matchAll(new RegExp(`\\b([A-Za-z_$][\\w$]*)\\s*\\(\\s*${ctx}\\s*[,)]`, "g"))) {
    if (!NOT_ASSERTING.test(name)) return true;
  }
  return false;
}

function tracked(root) {
  try {
    return execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] })
      .split("\n")
      .filter((f) => TEST_FILE.test(f));
  } catch {
    return [];
  }
}

/**
 * Returns the whole balanced-paren span of each `it(...)` / `test(...)` call.
 *
 * Deliberately not trying to find the callback body: `it("x", {timeout: 1}, fn)`
 * puts an options object where the body looks like it should be, and reading
 * that object instead of the body reports every timed test as assertionless.
 * Searching the entire call span cannot make that mistake.
 */
function testCalls(source) {
  const calls = [];
  const opener = /\b(?:it|test)\s*(?:\.\w+)?\s*\(\s*(['"`])(.*?)\1\s*,/g;
  for (let m = opener.exec(source); m; m = opener.exec(source)) {
    const open = source.indexOf("(", m.index);
    if (open === -1) continue;
    let depth = 0;
    let end = open;
    for (; end < source.length; end += 1) {
      const c = source[end];
      if (c === "(") depth += 1;
      else if (c === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    calls.push({
      name: m[2],
      span: source.slice(open, end + 1),
      line: source.slice(0, m.index).split("\n").length,
    });
    opener.lastIndex = end;
  }
  return calls;
}

export function noAssertion(root) {
  const findings = [];
  for (const file of tracked(root)) {
    let source;
    try {
      source = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    if (TYPE_ONLY.test(source)) continue;
    for (const { name, span, line } of testCalls(source)) {
      if (ASSERT.test(span) || PLAN.test(span)) continue;
      if (helperAsserts(span, contextName(span))) continue;
      // A body that is only a call with no assertion still might throw on
      // failure, so require some substance before calling it hollow.
      if (span.replace(/\s/g, "").length < 24) continue;
      findings.push({
        check: "no-assertion",
        severity: "high",
        file: `${file}:${line}`,
        summary: `test "${name}" asserts nothing, so nothing but a thrown error can fail it`,
        evidence: span.replace(/\s+/g, " ").slice(0, 160),
        reproduction: [
          `# the test passes with its subject broken, because nothing is checked:`,
          `sed -n '${line},$p' ${file} | head -20`,
        ],
        why: "The test runs the code and reports green whatever the code returns, so it passes unless something throws. It counts toward coverage and guards no behaviour.",
      });
    }
  }
  return findings;
}
