/**
 * The SARIF and Markdown reports are pure functions over findings, so these
 * tests hand them findings directly and assert the shape a GitHub upload and a
 * PR comment depend on.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { toSarif } from "../src/report/sarif.mjs";
import { toMarkdown, MARKER } from "../src/report/github.mjs";

const findings = [
  {
    check: "no-assertion",
    severity: "high",
    file: "test/a.test.mjs:12",
    summary: 'test "hollow" asserts nothing',
    why: "It passes whatever the code returns.",
    reproduction: ["sed -n '12,$p' test/a.test.mjs | head"],
  },
  {
    check: "unrun-check",
    severity: "medium",
    file: "package.json",
    summary: 'script "test:online" is never run',
    why: "A gate nobody invokes cannot fail.",
    reproduction: ["grep -R test:online .github/workflows/"],
  },
];

test("toSarif emits a 2.1.0 run with one rule per check and a result per finding", () => {
  const doc = toSarif(findings, { version: "9.9.9" });
  assert.equal(doc.version, "2.1.0");
  const run = doc.runs[0];
  assert.equal(run.tool.driver.version, "9.9.9");
  assert.equal(run.tool.driver.rules.length, 2, "one rule per distinct check");
  assert.equal(run.results.length, 2);
});

test("toSarif maps severity to a SARIF level and splits path:line into a region", () => {
  const doc = toSarif(findings);
  const [first, second] = doc.runs[0].results;
  assert.equal(first.level, "error", "high maps to error");
  assert.equal(second.level, "warning", "medium maps to warning");
  const loc = first.locations[0].physicalLocation;
  assert.equal(loc.artifactLocation.uri, "test/a.test.mjs", "the :line is stripped from the uri");
  assert.equal(loc.region.startLine, 12);
  assert.match(first.message.text, /Reproduce:/);
});

test("toSarif leaves a fileless finding without a region", () => {
  const doc = toSarif([{ check: "x", severity: "low", file: "package.json", summary: "s", reproduction: ["r"] }]);
  const loc = doc.runs[0].results[0].locations[0].physicalLocation;
  assert.equal(loc.artifactLocation.uri, "package.json");
  assert.equal(loc.region, undefined, "no line means no region");
  assert.equal(doc.runs[0].results[0].level, "note", "low maps to note");
});

test("toMarkdown carries the marker, a count, a table and a details block per finding", () => {
  const md = toMarkdown(findings, { version: "9.9.9" });
  assert.ok(md.startsWith(MARKER), "the marker must lead so the Action can find its own comment");
  assert.match(md, /found 2 holes/);
  assert.match(md, /\| severity \| check \| where \|/);
  assert.match(md, /<details>/);
  assert.match(md, /test:online/);
  assert.match(md, /margyn\.xyz/);
});

test("toMarkdown says so plainly when there is nothing to report", () => {
  const md = toMarkdown([]);
  assert.ok(md.startsWith(MARKER));
  assert.match(md, /nothing hollow found/i);
});

test("toMarkdown lists what proof mode withdrew and badges what it kept", () => {
  const kept = [{ ...findings[0], proven: { status: "reproduced", output: "MARGYN_NO_ASSERT_IN_BODY" } }];
  const retracted = [{ check: "lint-blindspot", file: "biome.json", proven: { status: "retracted", missing: ["X"] } }];
  const md = toMarkdown(kept, { retracted });
  assert.match(md, /reproduced/);
  assert.match(md, /withdrew 1 finding/);
  assert.match(md, /lint-blindspot/);
});
