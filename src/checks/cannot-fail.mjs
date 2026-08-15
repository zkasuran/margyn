/**
 * CHECK 6: tests that cannot fail because what they assert cannot be false.
 *
 * no-assertion reports a body with nothing in it. This one reports the harder
 * case: a body full of assertions that are green whatever the code does. Both
 * report the same defect, a test that cannot go red, and neither needs a mutation
 * run to prove it.
 *
 * Three rules ship, and the ones that do not ship matter as much, because a
 * scanner that cries wolf is the thing this tool hunts. Measured over 27,000 test
 * files on this machine before any of it was written:
 *
 *   ships   a constant-true assertion, gated on the test having no declared
 *           assertion count. Without that gate the rule is 90% noise: 223 of 236
 *           `assert.ok(true, 'onSend called')` lines in fastify and avvio are
 *           real checks that a callback fired, held up by `t.plan(n)`.
 *   ships   an assertion inside a try whose catch cannot fail the test. Ten real
 *           instances, and the worst consequence of any pattern here: two of them
 *           pass whether or not the server under test is running.
 *   ships   a status list that mixes success and failure codes, which accepts the
 *           outcome it was written to reject.
 *
 *   dropped a top-level `||` in an assertion. 110 sites read by hand: 2 were
 *           vacuous, 9 tolerant, 72 plainly correct. A rule that is right 2% of
 *           the time is noise, and the thing that decides the class is what the
 *           constants mean, which no text scanner can read.
 *   dropped an empty catch on its own. 301 files, and the assertion is normally
 *           after the try rather than inside it.
 *   dropped `it.skip` and `test.todo`. A runner reports those as skipped, not as
 *           passed, so they are a coverage question rather than a false green.
 *   dropped an empty test body, which no-assertion already reports.
 *
 * Every rule works on source with comments and string contents blanked, because
 * this corpus contains assertions whose expected value is itself a snippet of
 * vacuous code.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { shq } from "../shell.mjs";
import { blanked, blockAt, testCalls, trackedTests } from "./test-files.mjs";

/** A declared count is a real assertion, so a body carrying one is not vacuous. */
const PLANNED = /\bplan\s*\(\s*\d+\s*\)|\bexpect\s*\.\s*(?:assertions\s*\(\s*\d+\s*\)|hasAssertions\s*\(\s*\))/;

/**
 * Assertions whose subject is a literal that is already true.
 *
 * Each alternative is a form that occurs in real suites. `assert.ok(1)` is here
 * because it is what a wrong-argument call looks like: `assert.ok(1, count)`
 * passes on the literal and never looks at the count.
 */
const CONSTANT_TRUE = [
  /\bexpect\s*\(\s*true\s*\)\s*\.\s*(?:toBe|toEqual|toStrictEqual)\s*\(\s*true\s*\)/,
  /\bexpect\s*\(\s*(?:true|1)\s*\)\s*\.\s*toBeTruthy\s*\(\s*\)/,
  /\bexpect\s*\(\s*true\s*\)\s*\.\s*to\s*\.\s*be\s*\.\s*true\b/,
  /\bassert\s*\(\s*(?:true|1)\s*[,)]/,
  /\bassert\s*\.\s*(?:ok|isOk|isTrue)\s*\(\s*(?:true|1)\s*[,)]/,
  /\bassert\s*\.\s*(?:strictEqual|equal|deepEqual|deepStrictEqual)\s*\(\s*true\s*,\s*true\s*[,)]/,
  /\b(?:t|ctx|assert)\s*\.\s*(?:assert\s*\.\s*)?ok\s*\(\s*true\s*[,)]/,
];

/** Anything that can carry a failure out of a catch block. */
const CATCH_FAILS = /\bthrow\b|\breject\b|\.fail\s*\(|\bfail\s*\(|process\.exit/;
/**
 * A catch that hands the error to code after the try is not swallowing it.
 *
 * `try { await f() } catch (err) { thrown = err }` followed by
 * `expect(thrown).toBeInstanceOf(...)` is the standard way to assert on a
 * rejection, and it is correct. The first draft of this rule reported seven of
 * them in one file, so the assignment is the signal that separates a capture from
 * a shrug.
 */
const CATCH_CAPTURES = /[^=!<>]=[^=]|\.push\s*\(/;
/**
 * Assertions, matched strictly.
 *
 * no-assertion matches any identifier containing assert, because there a helper
 * one call away is still an assertion and a miss costs only a missed finding.
 * Here a loose match costs a false positive: the subject under test is often
 * called `assertUrlIsPublic`, and reading that as an assertion turns every
 * correct rejection test into a finding.
 */
const ASSERTS = /\bexpect\s*\(|\bassert\s*[(.]|\bshould\s*\(|\.\s*should\b|\b(?:t|ctx)\s*\.\s*(?:ok|is|equal|deepEqual|throws|assert)\b|\.\s*to\s*\.\s*(?:be|equal|deep|have|exist|throw)/;
/**
 * An assertion that only says an error arrived, without pinning which one.
 *
 * This is what makes a deliberate fail marker useless: `expect(true).to.be.false`
 * throws its own AssertionError, the catch catches that, and `expect(error).to.exist`
 * is satisfied by it. Checking the message or the type instead would separate the
 * two, which is why those forms are excluded here.
 */
const EXISTENCE_ONLY = /\.(?:message|name|code|stack|status)\b|instanceof|toThrow|toMatch|match\s*\(|include|contain|equal|\bbe\s*\.\s*an?\b/;
/** A marker whose only job is to fail the test if the line is reached. */
const FAIL_MARKER = /\bexpect\s*\(\s*true\s*\)\s*\.\s*to\s*\.\s*be\s*\.\s*false\b|\bexpect\s*\(\s*true\s*\)\s*\.\s*toBe\s*\(\s*false\s*\)|\b(?:expect|assert|should|t|ctx)\s*\.\s*(?:assert\s*\.\s*)?fail\s*\(/;

/** Success and failure, as HTTP defines them rather than as we would like. */
const failureCode = (n) => n >= 400;
const STATUS_LIST = /(?:expect\s*\(\s*)?\[\s*(\d{3}(?:\s*,\s*\d{3})+)\s*,?\s*\]\s*\)?\s*\.\s*(?:toContain|includes)\s*\(/g;

const lineOf = (source, index) => source.slice(0, index).split("\n").length;
const oneLine = (text) => text.replace(/\s+/g, " ").trim().slice(0, 160);

/** Every `catch` block inside a span, with the `try` block it belongs to. */
function tryCatchPairs(span, offset) {
  const pairs = [];
  const opener = /\btry\s*\{/g;
  for (let m = opener.exec(span); m; m = opener.exec(span)) {
    const tryBlock = blockAt(span, m.index);
    if (!tryBlock) continue;
    const after = span.slice(tryBlock.end + 1, tryBlock.end + 80);
    const isCatch = /^\s*catch\b/.test(after);
    if (!isCatch) continue;
    const catchBlock = blockAt(span, tryBlock.end + 1);
    if (!catchBlock) continue;
    pairs.push({
      tryBody: tryBlock.body,
      catchBody: catchBlock.body,
      at: offset + m.index,
      catchAt: offset + catchBlock.start,
      catchEnd: offset + catchBlock.end,
    });
    opener.lastIndex = catchBlock.end;
  }
  return pairs;
}

export function cannotFail(root) {
  const findings = [];
  for (const file of trackedTests(root)) {
    let raw;
    try {
      raw = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    const source = blanked(raw);

    // Names and line numbers come from the real source; every match runs against
    // the blanked copy. The two are the same length, so one offset reads both.
    for (const call of testCalls(source, raw)) {
      const { name, start } = call;
      const span = source.slice(start, start + call.span.length);
      const at = (index) => lineOf(source, start + index);

      const pairs = tryCatchPairs(span, start);

      // ---- rule 1: an assertion on a literal that is already true
      //
      // Only two positions are reported, because only these two make the test
      // unfalsifiable. Inside a catch, the vacuous assertion is what turns a
      // thrown failure into a pass. As the test's only assertion, nothing but an
      // exception can fail the test. A literal assertion alongside real ones is a
      // "we got here" marker, which is noise to report: fastify's
      // `try { Fastify(o); t.assert.ok(true) } catch (e) { t.assert.fail(e.message) }`
      // fails properly through its catch.
      if (!PLANNED.test(span)) {
        for (const rule of CONSTANT_TRUE) {
          const hit = span.match(rule);
          if (!hit) continue;
          const inCatch = pairs.some(
            (p) => hit.index >= p.catchAt - start && hit.index <= p.catchEnd - start,
          );
          const alone = !ASSERTS.test(span.slice(0, hit.index) + span.slice(hit.index + hit[0].length));
          if (!inCatch && !alone) continue;
          const line = at(hit.index);
          findings.push({
            check: "cannot-fail",
            severity: "high",
            file: `${file}:${line}`,
            summary: inCatch
              ? `test "${name}" answers a caught error with an assertion on a literal, so the failure path passes`
              : `test "${name}" has one assertion and it is on a literal, so nothing but an exception can fail it`,
            evidence: oneLine(raw.split("\n")[line - 1] ?? hit[0]),
            reproduction: [
              `# the assertion holds with the subject removed entirely:`,
              `sed -n '${line}p' ${file}`,
            ],
            proof: {
              verifiable: true,
              commands: [
                `sed -n ${shq(`${line}p`)} ${shq(file)} | grep -Eq '(expect|assert)[^)]*\\(([[:space:]]*)(true|1)([[:space:]]*)[,)]|expect\\([[:space:]]*true[[:space:]]*\\)' && echo MARGYN_CONSTANT_TRUE_ASSERT || echo MARGYN_NOT_CONSTANT`,
                `sed -n ${shq(`${call.line},${call.endLine}p`)} ${shq(file)} | grep -Eq 'plan[[:space:]]*\\([[:space:]]*[0-9]+|assertions[[:space:]]*\\([[:space:]]*[0-9]+|hasAssertions' && echo MARGYN_HAS_PLAN || echo MARGYN_NO_PLAN`,
              ],
              expect: ["MARGYN_CONSTANT_TRUE_ASSERT", "MARGYN_NO_PLAN"],
            },
            why: inCatch
              ? "The error was caught and answered with an assertion that is true by construction, so the test reports green on the path that was supposed to fail it."
              : "The assertion is about a literal, not about the code, so it reports green with the subject broken or deleted. A declared assertion count would make it a real check, and this test declares none.",
          });
          break;
        }
      }

      // ---- rules 2a and 2b: a catch that cannot fail the test
      for (const pair of pairs) {
        const catchCanFail = CATCH_FAILS.test(pair.catchBody) || CATCH_CAPTURES.test(pair.catchBody);
        const catchAsserts = ASSERTS.test(pair.catchBody);
        const line = lineOf(source, pair.at);
        const catchLine = lineOf(source, pair.catchAt);
        const catchEndLine = lineOf(source, pair.catchEnd);

        const swallows = !PLANNED.test(span) && ASSERTS.test(pair.tryBody) && !catchAsserts && !catchCanFail;
        // Neither shape is reported under a declared count. `t.plan(n)` counts the
        // assertions each path makes, so a swallowed one usually changes the count
        // and the plan goes red: fastify's hooks.test.js plans 1 and the failure
        // path makes 2. Sometimes it coincides and the test really cannot fail,
        // body-limit.test.js plans 4 and the failure path makes exactly 4, but a
        // text scanner should not guess which, and 21 of those in one file is the
        // wolf cry this tool exists to avoid.
        const marked = !PLANNED.test(span)
          && FAIL_MARKER.test(pair.tryBody)
          && catchAsserts
          && !catchCanFail
          && !EXISTENCE_ONLY.test(pair.catchBody);
        if (!swallows && !marked) continue;

        findings.push({
          check: "cannot-fail",
          severity: "high",
          file: `${file}:${line}`,
          summary: swallows
            ? `test "${name}" asserts inside a try whose catch cannot fail it, so the assertion is swallowed`
            : `test "${name}" puts a fail marker in a try whose catch is satisfied by the marker's own error`,
          evidence: oneLine(`catch { ${pair.catchBody} }`),
          reproduction: [
            `# read the catch: nothing in it can carry a failure out of the test`,
            `sed -n '${catchLine},${catchEndLine}p' ${file}`,
          ],
          proof: {
            verifiable: true,
            commands: [
              `sed -n ${shq(`${catchLine},${catchEndLine}p`)} ${shq(file)} | grep -Eq '(throw|reject|\\.fail[[:space:]]*\\(|process\\.exit|[^=!<>]=[^=]|\\.push[[:space:]]*\\()' && echo MARGYN_CATCH_CAN_FAIL || echo MARGYN_CATCH_CANNOT_FAIL`,
            ],
            expect: ["MARGYN_CATCH_CANNOT_FAIL"],
          },
          why: swallows
            ? "An assertion that fails throws, the catch catches that throw, and the test reports green. It passes with its subject down."
            : "The marker exists to fail the test when that line is reached. Its own error satisfies the catch, so both paths pass. Checking the error's type or message instead would tell them apart.",
        });
      }

      // ---- rule 3: a status list that accepts both outcomes
      for (const m of span.matchAll(STATUS_LIST)) {
        const codes = m[1].split(",").map((s) => Number(s.trim()));
        if (codes.some((n) => n < 100 || n > 599)) continue;
        const failures = codes.filter(failureCode);
        const successes = codes.filter((n) => !failureCode(n));
        // One class only is a real test: all failures is a negative case, all
        // successes is a list of acceptable outcomes.
        if (!failures.length || !successes.length) continue;
        const line = at(m.index);
        findings.push({
          check: "cannot-fail",
          severity: "medium",
          file: `${file}:${line}`,
          summary: `test "${name}" accepts ${successes.join(", ")} and ${failures.join(", ")}, so it passes whether the request succeeded or failed`,
          evidence: oneLine(raw.split("\n")[line - 1] ?? m[0]),
          reproduction: [
            `# the list spans success and failure, so the assertion cannot separate them:`,
            `sed -n '${line}p' ${file}`,
          ],
          proof: {
            verifiable: true,
            commands: [
              `sed -n ${shq(`${line}p`)} ${shq(file)} | grep -Eq '\\[[^]]*[1-3][0-9][0-9][^]]*[45][0-9][0-9][^]]*\\]|\\[[^]]*[45][0-9][0-9][^]]*[1-3][0-9][0-9][^]]*\\]' && echo MARGYN_MIXED_STATUS_CLASSES || echo MARGYN_ONE_CLASS`,
            ],
            expect: ["MARGYN_MIXED_STATUS_CLASSES"],
          },
          why: "A list holding both a success and a failure code cannot distinguish them. The endpoint can start returning the error and this test stays green.",
        });
      }
    }
  }
  return findings;
}
