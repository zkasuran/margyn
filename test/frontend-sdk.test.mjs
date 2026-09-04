/**
 * The frontend has to match the SDK it calls.
 *
 * There is no DOM harness in this repository and adding one to test four lines
 * would cost more than it protects, so this reads `web/public/app.mjs` as text and
 * holds it to the three facts about @tiun/sdk@0.9.1 that were each wrong in
 * production for a month:
 *
 *   1. `getUser()` is synchronous. `getUser().catch(...)` throws a TypeError, and
 *      inside an async function that becomes a rejected promise nobody awaits, so
 *      the failure is silent and the page keeps whatever state the HTML shipped.
 *   2. The user it returns is `{isAuthenticated, user}`, so `productAccess` is one
 *      level down. Read at the top level it is always empty, so a paying customer
 *      never sees the licence control.
 *   3. The SDK emits seven event names and `checkout:complete` is not one of them.
 *      Subscribing to a name it never emits means a finished purchase never
 *      repaints the page.
 *
 * The event list is the SDK's own, taken from every `triggerEvent(...)` call in
 * @tiun/sdk@0.9.1. Bump the version, re-read that list, then update this one.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const APP = readFileSync(new URL("../web/public/app.mjs", import.meta.url), "utf8");

/**
 * Comments in this file describe the bugs by name, including the wrong call they
 * replaced, so a check for "does the code do X" has to read code rather than prose.
 * Blanking comments keeps their length, so a failure still points at a real line.
 */
const CODE = APP.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/^\s*\/\/.*$/gm, (m) => " ".repeat(m.length));

/** Every event @tiun/sdk@0.9.1 passes to triggerEvent. Nothing else can fire. */
const SDK_EVENT_NAMES = ["error", "login", "logout", "paywallHide", "paywallShow", "ready", "userChange"];

test("the SDK version this file is written against is the one the page imports", () => {
  assert.match(APP, /esm\.sh\/@tiun\/sdk@0\.9\.1/);
});

test("getUser is never treated as a promise, because it is not one", () => {
  assert.doesNotMatch(CODE, /getUser\(\)\s*\.\s*(catch|then|finally)/);
  assert.doesNotMatch(CODE, /await\s+tiun\.getUser\(/);
});

test("purchases are read one level down, where the SDK puts them", () => {
  const productAccess = CODE.match(/productAccess/g) ?? [];
  assert.ok(productAccess.length >= 1, "nothing reads productAccess at all");
  // The nested read is the one that works. Requiring it by name stops a revert.
  assert.match(CODE, /\binner\?\.productAccess\b/);
});

test("every event subscribed to is an event the SDK emits", () => {
  const list = CODE.match(/const SDK_EVENTS = \[([^\]]*)\]/);
  assert.ok(list, "app.mjs no longer declares SDK_EVENTS, so this test cannot check it");
  const subscribed = [...list[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(subscribed.length > 0, "SDK_EVENTS is empty, so the page never repaints");
  for (const name of subscribed) {
    assert.ok(SDK_EVENT_NAMES.includes(name), `the SDK never emits "${name}"`);
  }
});

test("the two events that carry a purchase are both subscribed", () => {
  const list = CODE.match(/const SDK_EVENTS = \[([^\]]*)\]/)[1];
  for (const needed of ["userChange", "paywallHide"]) {
    assert.match(list, new RegExp(`"${needed}"`), `${needed} is how a finished checkout reaches the page`);
  }
});

test("a dead SDK is detected rather than assumed working", () => {
  // waitForReady() resolving is not proof: block the runtime bundle and it still
  // resolves. The Resource Timing check is the part that actually answers.
  assert.match(CODE, /background_js/);
  assert.match(CODE, /securitypolicyviolation/);
  assert.match(CODE, /checkoutUnavailable\(/);
});

test("only the directives that break checkout are treated as fatal", () => {
  // A blocked webfont is cosmetic. Treating it as fatal disabled a working
  // checkout once already, on the deploy that first allowed the runtime bundle.
  assert.match(CODE, /FATAL_DIRECTIVES/);
  const set = CODE.match(/FATAL_DIRECTIVES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(set, "FATAL_DIRECTIVES is no longer a Set literal this test can read");
  const names = [...set[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(names.sort(), ["connect-src", "frame-src", "script-src", "style-src"]);
  assert.ok(!names.includes("font-src"));
  assert.ok(!names.includes("img-src"));
});
