/**
 * The licence token format, in one place.
 *
 * Two runtimes mint licences: the local Node server and the deployed Worker.
 * They hold different crypto APIs (`node:crypto` and WebCrypto), but the token
 * they produce has to be byte-identical, because one CLI verifies both. So the
 * format lives here and each runtime brings only its own signer.
 *
 * Nothing here touches `Buffer`, on purpose. Workers only has it behind a
 * compatibility flag, and a shared module that needs a flag to load is not
 * shared. `btoa`, `atob`, `TextEncoder` and `Uint8Array` exist in both.
 *
 * Token shape is `base64url(payload).base64url(signature)`. That is a JWT in
 * spirit, without a library to parse a header whose two fields we already know.
 */

/** base64url of raw bytes. No padding, which is what the format specifies. */
export function encode(bytes) {
  let ascii = "";
  for (const byte of bytes) ascii += String.fromCharCode(byte);
  return btoa(ascii).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Bytes from base64url. Padding is restored first: we never write it, but a
 * licence that arrives through a form or an editor may have picked it up.
 */
export function decode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const ascii = atob(padded);
  const out = new Uint8Array(ascii.length);
  for (let i = 0; i < ascii.length; i += 1) out[i] = ascii.charCodeAt(i);
  return out;
}

const utf8 = new TextEncoder();

/**
 * The exact bytes a signer must sign: the ASCII of the encoded payload, not the
 * payload itself. Signing the encoding rather than the JSON means a verifier
 * never has to re-serialise, so it cannot disagree about key order or spacing.
 */
export const bodyOf = (payload) => encode(utf8.encode(JSON.stringify(payload)));
export const bytesToSign = (body) => utf8.encode(body);

/** Joins a signed body to its signature. */
export const tokenOf = (body, signature) => `${body}.${encode(signature)}`;

/** Reads a token back into its two halves, or says why it is not one. */
export function splitToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return { error: "not a licence token" };
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length > 0) return { error: "licence token is malformed" };
  return { body, signature };
}

/** Reads the payload out of a body that has already been verified. */
export function payloadOf(body) {
  try {
    return { payload: JSON.parse(new TextDecoder().decode(decode(body))) };
  } catch {
    return { error: "licence payload is not readable" };
  }
}
