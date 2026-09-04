/**
 * The content security policy has to let the paid path work.
 *
 * This exists because it did not. The policy named the Tiun hosts in `connect-src`
 * only, which reads correct until you notice the SDK is three requests, not one:
 * the module from esm.sh, then its own stylesheet and its own runtime bundle from
 * the API host, then a frame for sign in and checkout. Those last three are
 * style-src, script-src and frame-src, so the browser refused them and the buy
 * button on the pricing page did nothing from 2026-08-06 to 2026-09-04. Zero
 * checkouts opened in that window, which matches Tiun reporting zero sessions.
 *
 * So every directive the SDK actually needs is asserted here by name. A future
 * tightening that drops one fails this file instead of the checkout.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SECURITY_HEADERS, TIUN_ASSETS, TIUN_HOSTS } from "../worker/index.mjs";

/** Reads one directive out of the policy string, without regex guesswork. */
function directive(name) {
  const policy = SECURITY_HEADERS["content-security-policy"];
  const found = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(name + " "));
  assert.ok(found, `the policy has no ${name} directive: ${policy}`);
  return found.slice(name.length).trim().split(/\s+/).filter(Boolean);
}

const HOSTS = TIUN_HOSTS.split(/\s+/);

test("both Tiun hosts are named, so a sandbox deploy behaves like a live one", () => {
  assert.deepEqual(HOSTS, ["https://api.tiun.live", "https://api-sandbox.tiun.live"]);
});

for (const name of ["script-src", "style-src", "img-src", "font-src", "connect-src", "frame-src"]) {
  test(`${name} allows the Tiun hosts, because the SDK loads through it`, () => {
    const sources = directive(name);
    for (const host of HOSTS) {
      assert.ok(sources.includes(host), `${name} is missing ${host}: ${sources.join(" ")}`);
    }
  });
}

test("the asset host is allowed for the webfont the stylesheet asks for", () => {
  assert.equal(TIUN_ASSETS, "https://assets.tiun.dev");
  assert.ok(directive("font-src").includes(TIUN_ASSETS));
  assert.ok(directive("img-src").includes(TIUN_ASSETS));
});

test("the asset host is not a script or a frame source, because it serves neither", () => {
  assert.ok(!directive("script-src").includes(TIUN_ASSETS));
  assert.ok(!directive("style-src").includes(TIUN_ASSETS));
  assert.ok(!directive("frame-src").includes(TIUN_ASSETS));
});

test("the SDK module's own origin stays allowed", () => {
  assert.ok(directive("script-src").includes("https://esm.sh"));
  assert.ok(directive("connect-src").includes("https://esm.sh"));
});

test("nothing is widened to a bare scheme, which would allow any host", () => {
  const policy = SECURITY_HEADERS["content-security-policy"];
  for (const bad of ["https:", "http:", "*", "'unsafe-eval'"]) {
    assert.ok(!policy.split(/\s+/).includes(bad), `the policy allows ${bad}: ${policy}`);
  }
});

test("the defences that have nothing to do with Tiun are untouched", () => {
  assert.deepEqual(directive("default-src"), ["'self'"]);
  assert.deepEqual(directive("frame-ancestors"), ["'none'"]);
  assert.deepEqual(directive("base-uri"), ["'none'"]);
  assert.deepEqual(directive("form-action"), ["'none'"]);
  assert.deepEqual(directive("object-src"), ["'none'"]);
  assert.equal(SECURITY_HEADERS["x-frame-options"], "DENY");
  assert.equal(SECURITY_HEADERS["x-content-type-options"], "nosniff");
  assert.equal(SECURITY_HEADERS["referrer-policy"], "strict-origin-when-cross-origin");
});

test("frame-src is not left to fall back to default-src, which would block checkout", () => {
  // `default-src 'self'` covers frame-src when frame-src is absent, and 'self'
  // does not include Tiun, so the frame the checkout renders in would be refused.
  const policy = SECURITY_HEADERS["content-security-policy"];
  assert.match(policy, /frame-src /);
});
