/**
 * The suggestion box is a pure function, so these tests hand it request bodies
 * and assert what it prepares. Nothing is stored, so what it returns is the
 * entire behaviour: a reference, a label and a link that has to work when it is
 * opened.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { suggest } from "../src/suggest.mjs";

const text = "margyn reports every package's dist directory as missing source in our monorepo";

test("a suggestion prepares a labelled, tracked issue", () => {
  const r = suggest({ kind: "feedback", suggestion: text, contact: "dev@example.com" });
  assert.equal(r.ok, true);
  assert.equal(r.status, 200);
  assert.match(r.reference, /^SG-[0-9A-Z]{6,7}$/);
  assert.equal(r.label, "feedback");
  assert.equal(r.trimmed, false);
  assert.match(r.issue.url, /github\.com\/zkasuran\/margyn\/issues\/new/);
  assert.match(r.issue.url, /labels=feedback/);
  const decoded = decodeURIComponent(r.issue.url);
  assert.ok(decoded.includes(text), "the suggestion has to reach the issue");
  assert.ok(decoded.includes("dev@example.com"), "the contact travels when it is given");
  assert.ok(decoded.includes(r.reference), "the reference is in the body, so quoting it finds this");
});

test("a feature request is labelled as one", () => {
  const r = suggest({ kind: "feature", suggestion: "add a check for tests that are skipped forever" });
  assert.equal(r.ok, true);
  assert.equal(r.label, "feature-request");
  assert.match(r.issue.title, /^Feature request SG-/);
});

test("kind defaults to feedback and an unknown kind is refused", () => {
  assert.equal(suggest({ suggestion: text }).label, "feedback");
  const bad = suggest({ kind: "rant", suggestion: text });
  assert.equal(bad.ok, false);
  assert.equal(bad.status, 400);
  assert.match(bad.error, /feedback or feature/);
});

test("an empty or one-word suggestion is refused rather than prepared", () => {
  for (const suggestion of ["", "   ", "more checks", undefined]) {
    const r = suggest({ suggestion });
    assert.equal(r.ok, false, `${JSON.stringify(suggestion)} must not prepare an issue`);
    assert.equal(r.status, 400);
  }
});

test("a suggestion over the cap is refused with the number in the reason", () => {
  const r = suggest({ suggestion: "x".repeat(2001) });
  assert.equal(r.ok, false);
  assert.match(r.error, /2000/);
});

test("a contact cannot add a line of its own to the prepared issue", () => {
  const r = suggest({ suggestion: text, contact: "me@example.com\nContact: someone@else.example" });
  const lines = decodeURIComponent(r.issue.url).split("\n");
  const contactLines = lines.filter((l) => l.startsWith("Contact:"));
  assert.equal(contactLines.length, 1, "newlines are flattened, so there is one contact line");
  assert.equal(contactLines[0], "Contact: me@example.com Contact: someone@else.example");
});

test("nothing a visitor types can escape the body parameter", () => {
  const r = suggest({ suggestion: `${text} &labels=bug&assignees=someone#fragment` });
  const [, query] = r.issue.url.split("?");
  const params = new URLSearchParams(query);
  assert.equal(params.get("labels"), "feedback", "labels stays ours");
  assert.equal(params.get("assignees"), null, "no assignee can be smuggled in");
  assert.ok(params.get("body").includes("&labels=bug"), "the text is preserved, as text");
});

test("the same suggestion always gets the same reference, a different one does not", () => {
  const a = suggest({ suggestion: text, contact: "a@example.com" });
  const b = suggest({ suggestion: text, contact: "a@example.com" });
  const c = suggest({ suggestion: `${text}!`, contact: "a@example.com" });
  assert.equal(a.reference, b.reference);
  assert.notEqual(a.reference, c.reference);
});

test("a suggestion that would not fit the link is trimmed, and says so", () => {
  // Percent encoding is where a link gets long: one accented character costs six
  // characters in a URL, so the cap bites long before the 2000 the form allows.
  const r = suggest({ suggestion: "é".repeat(2000) });
  assert.equal(r.ok, true);
  assert.equal(r.trimmed, true);
  assert.ok(r.issue.url.length <= 6000, `the prepared link is ${r.issue.url.length} characters`);
  assert.match(decodeURIComponent(r.issue.url), /trimmed to fit the link/);

  const plain = suggest({ suggestion: "word ".repeat(400).trim() });
  assert.equal(plain.trimmed, false, "a full length ASCII suggestion must survive whole");
  assert.ok(plain.issue.url.length <= 6000);
});

test("a suggestion with no contact prepares an issue with no contact line", () => {
  const r = suggest({ suggestion: text });
  assert.equal(r.ok, true);
  assert.ok(!decodeURIComponent(r.issue.url).includes("Contact:"));
});
