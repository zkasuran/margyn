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
  assert.match(r.issue.url, /labels=fix-request/);
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
