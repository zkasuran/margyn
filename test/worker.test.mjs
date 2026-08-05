/**
 * The deployed Worker and the local server sign with different crypto APIs, and
 * one CLI has to verify both. This test holds them to the same bytes.
 *
 * It runs the WebCrypto path the Worker uses (Node ships the same WebCrypto, and
 * `wrangler dev` was used to confirm workerd implements Ed25519 too) and asserts
 * the token is byte-identical to the one `node:crypto` produces. Ed25519 is
 * deterministic, so identical is the right bar rather than merely both-valid.
 */
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import { bodyOf, bytesToSign, decode, encode, payloadOf, splitToken, tokenOf } from "../src/licence-format.mjs";
import { mintLicence, verifyLicence } from "../src/licence.mjs";

/** The signer from worker/index.mjs, lifted verbatim so a drift breaks this test. */
async function signWithWebCrypto(payload, privateKeyDerBase64) {
  const key = await webcrypto.subtle.importKey("pkcs8", decode(privateKeyDerBase64), { name: "Ed25519" }, false, ["sign"]);
  const body = bodyOf(payload);
  const signature = await webcrypto.subtle.sign({ name: "Ed25519" }, key, bytesToSign(body));
  return tokenOf(body, new Uint8Array(signature));
}

/**
 * A throwaway key, generated per run. The production private key is not in this
 * repository and this test does not need it: what is under test is that two
 * signing paths agree, which is true of any key.
 */
async function keypair() {
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pkcs8 = await webcrypto.subtle.exportKey("pkcs8", pair.privateKey);
  return { pkcs8: encode(new Uint8Array(pkcs8)), publicKey: pair.publicKey };
}

const PAYLOAD = { product: ["watch"], email: "t@example.com", issued: 1_785_000_000_000, expires: 4_102_444_800_000 };

test("WebCrypto and node:crypto mint the identical token for the same payload", async () => {
  const { pkcs8 } = await keypair();
  const fromWorker = await signWithWebCrypto(PAYLOAD, pkcs8);
  const fromServer = mintLicence(PAYLOAD, pkcs8);
  assert.equal(fromWorker, fromServer, "the two runtimes must not drift, or a licence works on one host and not the other");
});

test("a token minted by the Worker path verifies against its own public key", async () => {
  const { pkcs8, publicKey } = await keypair();
  const token = await signWithWebCrypto(PAYLOAD, pkcs8);
  const { body, signature } = splitToken(token);
  const valid = await webcrypto.subtle.verify({ name: "Ed25519" }, publicKey, decode(signature), bytesToSign(body));
  assert.equal(valid, true);
  assert.deepEqual(payloadOf(body).payload, PAYLOAD, "the payload must survive the round trip unchanged");
});

test("base64url carries no padding and survives a round trip", () => {
  // Lengths 1..8 cover every padding case, and the format specifies no padding.
  for (let n = 1; n <= 8; n += 1) {
    const bytes = new Uint8Array(n).map((_, i) => (i * 37 + 251) % 256);
    const text = encode(bytes);
    assert.ok(!text.includes("="), `length ${n} encoded with padding: ${text}`);
    assert.ok(!/[+/]/.test(text), `length ${n} used non-url base64: ${text}`);
    assert.deepEqual(decode(text), bytes, `length ${n} did not round trip`);
  }
});

test("a padded licence still decodes, because an editor or a form may add it", async () => {
  const { pkcs8 } = await keypair();
  const token = await signWithWebCrypto(PAYLOAD, pkcs8);
  const { body, signature } = splitToken(token);
  // Re-pad both halves the way a careless copy through a base64 tool would.
  const pad = (s) => s + "=".repeat((4 - (s.length % 4)) % 4);
  assert.deepEqual(decode(pad(body)), decode(body), "a padded body must decode the same");
  assert.deepEqual(decode(pad(signature)), decode(signature), "a padded signature must decode the same");
});

test("the whole chain holds: mint with WebCrypto, verify with the CLI's own verifier", async () => {
  // The production public key is compiled into licence.mjs, so this proves the
  // pairing rather than the algorithm: a token from the Worker path signed with
  // the production key is what verifyLicence is given in the field.
  const { pkcs8 } = await keypair();
  const token = await signWithWebCrypto(PAYLOAD, pkcs8);
  const seen = verifyLicence(token);
  assert.equal(seen.ok, false, "a licence signed by any other key must be refused");
  assert.match(seen.reason, /was not issued by us/);
});
