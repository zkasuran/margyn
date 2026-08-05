/**
 * Entitlement, verified offline.
 *
 * The scanner runs on the user's machine, so the machine has to decide for
 * itself whether a paid check is unlocked. It cannot call home: a CI runner on a
 * private network would fail, and a licence check that needs the network is a
 * new way for a build to go red for reasons that have nothing to do with the
 * code.
 *
 * So the server mints a short signed licence and the CLI verifies it against a
 * public key compiled in here. Ed25519 out of node:crypto, no dependency. The
 * private key never leaves the server, so a licence is a fact anyone can check
 * and nobody can forge.
 *
 * Token shape is `base64url(payload).base64url(signature)`. That is a JWT in
 * spirit, without a library to parse a header whose two fields we already know.
 */
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * The verifying half of the pair, SPKI DER in base64. Public by design: it
 * proves a licence came from us and grants nothing. Rotating it means shipping a
 * release, which is the price of scans that need no network.
 */
const PUBLIC_KEY_DER = "MCowBQYDK2VwAyEA/yodBs8rIx0kY4wXhgblL0rqJt+592jaJc9LlEzgasI=";

const encode = (buf) => Buffer.from(buf).toString("base64url");
const decode = (str) => Buffer.from(str, "base64url");

let cachedKey = null;
function publicKey() {
  cachedKey ??= createPublicKey({ key: decode(PUBLIC_KEY_DER), format: "der", type: "spki" });
  return cachedKey;
}

/**
 * Signs a licence. Server-side only: the CLI never calls this, because it holds
 * no private key to pass in.
 */
export function mintLicence(payload, privateKeyDerBase64) {
  const body = encode(JSON.stringify(payload));
  const key = createPrivateKey({ key: decode(privateKeyDerBase64), format: "der", type: "pkcs8" });
  return `${body}.${encode(sign(null, Buffer.from(body), key))}`;
}

/**
 * Verifies a licence token and returns what it entitles.
 *
 * Every failure is named rather than collapsed into false. "Your licence
 * expired" and "your licence was tampered with" are different conversations, and
 * a user who cannot tell them apart files the wrong bug.
 */
export function verifyLicence(token, now = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "not a licence token" };
  }
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length > 0) return { ok: false, reason: "licence token is malformed" };

  let valid = false;
  try {
    valid = verify(null, Buffer.from(body), publicKey(), decode(signature));
  } catch {
    return { ok: false, reason: "licence signature could not be checked" };
  }
  if (!valid) return { ok: false, reason: "licence signature does not match, so this licence was not issued by us" };

  let payload;
  try {
    payload = JSON.parse(decode(body).toString("utf8"));
  } catch {
    return { ok: false, reason: "licence payload is not readable" };
  }

  if (!payload.product) return { ok: false, reason: "licence names no product" };
  if (typeof payload.expires !== "number") return { ok: false, reason: "licence has no expiry" };
  if (payload.expires < now) {
    const on = new Date(payload.expires).toISOString().slice(0, 10);
    return { ok: false, reason: `licence expired on ${on}`, expired: true, payload };
  }
  return { ok: true, payload };
}

/**
 * Finds the licence without making the user pass it every time. Environment
 * first so CI can inject it as a secret, then the home directory for a laptop.
 */
export function readLicence(env = process.env) {
  const inline = env.MARGYN_LICENCE ?? env.MARGYN_LICENSE;
  if (inline) return { token: inline.trim(), source: env.MARGYN_LICENCE ? "MARGYN_LICENCE" : "MARGYN_LICENSE" };

  const path = join(env.MARGYN_HOME ?? homedir(), ".margyn", "licence");
  if (!existsSync(path)) return { token: null, source: null };
  try {
    return { token: readFileSync(path, "utf8").trim(), source: path };
  } catch {
    return { token: null, source: path, unreadable: true };
  }
}

/**
 * The one question the CLI asks. It returns why it said no, so a refusal can
 * explain itself instead of just denying.
 */
export function entitled(product, env = process.env, now = Date.now()) {
  const found = readLicence(env);
  if (!found.token) {
    const reason = found.unreadable ? `licence file at ${found.source} could not be read` : "no licence found";
    return { ok: false, reason };
  }
  const seen = verifyLicence(found.token, now);
  if (!seen.ok) return { ok: false, reason: seen.reason, source: found.source, expired: seen.expired };

  const products = Array.isArray(seen.payload.product) ? seen.payload.product : [seen.payload.product];
  if (!products.includes(product)) {
    return { ok: false, reason: `this licence covers ${products.join(", ")}, not ${product}`, source: found.source };
  }
  return { ok: true, payload: seen.payload, source: found.source };
}
