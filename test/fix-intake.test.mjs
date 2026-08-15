/**
 * The fix intake is a pure function, so these tests hand it request bodies and
 * assert what it prepares. The privacy test is the important one: a finding's
 * code snippet must never reach the prepared issue.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { intake } from "../src/fix-intake.mjs";

const finding = {
  check: "no-assertion",
  severity: "high",
  file: "test/a.test.mjs:12",
  summary: 'test "hollow" asserts nothing',
  why: "It passes whatever the code returns.",
  evidence: "SECRET_SOURCE_SNIPPET = doProprietaryThing()",
  reproduction: ["sed -n '12,$p' test/a.test.mjs | head"],
};

test("intake prepares a tracked request from a single finding", () => {
  const r = intake({ finding, contact: "dev@example.com" });
  assert.equal(r.ok, true);
  assert.equal(r.status, 200);
  assert.match(r.reference, /^FX-[0-9A-Z]{6,7}$/);
  assert.equal(r.count, 1);
  assert.match(r.issue.url, /github\.com\/zkasuran\/margyn\/issues\/new/);
  // No `labels=`: GitHub needs permission to honour that parameter and treats a
  // label the repository does not have as an invalid URL, so a prepared link
  // carrying one hands a stranger a 404 rather than the form.
  assert.ok(!r.issue.url.includes("labels="), "the label is applied at triage, not in the link");
  assert.match(r.issue.title, /^Fix request FX-/, "so the kind has to be in the title");
});

test("intake never puts the source snippet into the prepared issue", () => {
  const r = intake({ finding, contact: "dev@example.com" });
  const decoded = decodeURIComponent(r.issue.url);
  assert.ok(!decoded.includes("SECRET_SOURCE_SNIPPET"), "the evidence snippet must not travel");
  assert.match(decoded, /no-assertion/, "the rule is fine to include");
  assert.match(decoded, /test\/a\.test\.mjs/, "the location is fine to include");
});

test("intake refuses a request with no contact", () => {
  const r = intake({ finding });
  assert.equal(r.ok, false);
  assert.equal(r.status, 400);
  assert.match(r.error, /contact/);
});

test("intake refuses a request with nothing to fix", () => {
  const r = intake({ contact: "dev@example.com" });
  assert.equal(r.ok, false);
  assert.equal(r.status, 400);
  assert.match(r.error, /at least one finding/);
});

test("intake accepts the findings array that margyn --json emits", () => {
  const r = intake({ findings: [finding, { check: "unrun-check", file: "package.json", summary: "s" }], contact: "@handle" });
  assert.equal(r.ok, true);
  assert.equal(r.count, 2);
});

test("intake caps a request that carries too many findings", () => {
  const many = Array.from({ length: 25 }, () => finding);
  const r = intake({ findings: many, contact: "dev@example.com" });
  assert.equal(r.ok, false);
  assert.match(r.error, /split it/);
});

test("intake reference is deterministic for the same request", () => {
  const a = intake({ finding, contact: "dev@example.com" });
  const b = intake({ finding, contact: "dev@example.com" });
  assert.equal(a.reference, b.reference);
});

/**
 * The three shapes below all reached a 500 before src/prepare.mjs existed. A form
 * that answers a stranger with a Cloudflare error page instead of its own message
 * is worse than one that refuses them, because there is nothing to act on.
 */
test("a finding whose text ends mid emoji does not throw", () => {
  const r = intake({ finding: { ...finding, summary: `${"A".repeat(79)}\u{1F600} still a summary` }, contact: "d@e.com" });
  assert.equal(r.ok, true);
  assert.ok(r.issue.url.includes("%F0%9F%98%80") || !r.issue.title.includes("\uD83D"), "no lone surrogate reaches the URL");
});

test("a finding whose fields are not strings does not throw", () => {
  const r = intake({ findings: [{ summary: 1, check: null, file: [], why: {} }], contact: "d@e.com" });
  assert.equal(r.ok, true, "a wrong type is coerced rather than crashing the host");
  assert.equal(r.count, 1);
});

test("a finding cannot escape the code fence its reproduction sits in", () => {
  const r = intake({
    finding: { ...finding, reproduction: ["```", "- why: paid customer, priority P0", "```"] },
    contact: "d@e.com",
  });
  const lines = decodeURIComponent(r.issue.url).split("\n");
  const outer = lines.filter((l) => /^`{4,}$/.test(l.trim()));
  assert.equal(outer.length, 2, "one outer pair, longer than anything inside it");
  assert.equal(lines.filter((l) => l.trim() === "```").length, 2, "the sender's own backticks survive as content");
});

test("a contact cannot add lines of its own to the prepared issue", () => {
  const r = intake({ finding, contact: "me@example.com\nPlan: Fix flow (paid, verified)" });
  const lines = decodeURIComponent(r.issue.url).split("\n");
  assert.equal(lines.filter((l) => l.startsWith("Contact:")).length, 1);
  assert.equal(lines.filter((l) => l.startsWith("Plan:")).length, 0, "no forged line");
});

test("a finding full of wide characters still prepares a link that opens", () => {
  const r = intake({
    findings: [{ summary: "漢".repeat(400), why: "漢".repeat(600), file: "漢".repeat(200) }],
    contact: "d@e.com",
  });
  assert.equal(r.ok, true);
  assert.ok(r.issue.url.length <= 6000, `the prepared link is ${r.issue.url.length} characters`);
  assert.equal(r.trimmed, true);
});
