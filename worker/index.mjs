/**
 * Margyn on Cloudflare Workers: the hosted half of the product.
 *
 * What is here, and nothing else:
 *   GET  /api/config   the public snippet id and the product list
 *   POST /api/verify   exchanges the SDK's userVerificationToken for a user,
 *                      using the secret API key. Server-side only.
 *   POST /api/licence  mints a signed licence for a user Tiun says has paid.
 *   POST /api/fix-intake  turns a finding into a prefilled fix request.
 *   POST /api/suggest     turns feedback or a feature request into a prefilled
 *                         issue. Both of those store nothing: they answer with a
 *                         link the visitor submits under their own account.
 *
 * `/api/scan` is deliberately absent. The local server has it, because there the
 * caller and the repository are the same machine. Here a scan route would take a
 * filesystem path from a stranger and run git against it, which is a filesystem
 * probe wearing a product's clothes. Scanning stays on the user's machine or in
 * their CI, which is also why the licence is verified offline. `/api/config`
 * reports `scan: false` so the page tells the truth about that rather than
 * offering a button that 404s.
 *
 * The frontend rides inside this script rather than as Workers Assets: the assets
 * API returned a 500 on every attempt on 2026-08-05, and two files with no build
 * step are far inside the script size limit. One upload also means the page and
 * the API can never be deployed at different versions.
 *
 * WebCrypto signs here, `node:crypto` signs locally, and both produce the same
 * bytes because the format lives in one module. Proven by test/worker.test.mjs.
 */
import { granted } from "../src/entitlements.mjs";
import { intake } from "../src/fix-intake.mjs";
import { suggest } from "../src/suggest.mjs";
import { bodyOf, bytesToSign, decode, tokenOf } from "../src/licence-format.mjs";
import { STATIC } from "./static.generated.mjs";

/** A licence lasts 31 days, so a lapsed subscription stops working on its own. */
const LICENCE_DAYS = 31;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/**
 * Reads a JSON body without trusting its size. A Worker is billed on CPU, so an
 * unbounded parse is somebody else's denial of service on our account.
 */
async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 64_000) throw new Error("body too large");
  return raw ? JSON.parse(raw) : {};
}

/**
 * The environment, resolved once per request. Sandbox is the default: getting
 * this wrong towards live means charging real money, so the safe value is the
 * one you get by forgetting to set it.
 */
function config(env) {
  const sandbox = env.TIUN_ENV !== "live";
  return {
    sandbox,
    apiKey: sandbox ? env.TIUN_SANDBOX_API_KEY : env.TIUN_API_KEY,
    snippetId: sandbox ? env.TIUN_SANDBOX_SNIPPET_ID : env.TIUN_SNIPPET_ID,
    signingKey: env.MARGYN_LICENCE_KEY,
    // The path prefix is `live_api` on both hosts. @tiun/sdk@0.9.1 hardcodes
    // both and picks on the sandbox flag, so the environment is the hostname
    // plus which key you hold, never the path.
    base: sandbox ? "https://api-sandbox.tiun.live" : "https://api.tiun.live",
    products: [
      {
        key: "watch",
        name: "Watch",
        blurb: "Continuous auditing plus a CI gate that fails the build when a check goes hollow. Unlocks the mutation proof in the CLI.",
        id: sandbox ? env.TIUN_SANDBOX_PRODUCT_WATCH : env.TIUN_PRODUCT_WATCH,
      },
      {
        key: "team",
        name: "Team",
        blurb: "Watch for every repository the organisation owns, priority on issues, invoices on request.",
        id: sandbox ? env.TIUN_SANDBOX_PRODUCT_TEAM : env.TIUN_PRODUCT_TEAM,
      },
      {
        key: "fixflow",
        name: "Fix flow",
        blurb: "Up to three findings a month fixed for you, each as a patch carrying a test that fails before and passes after.",
        id: sandbox ? env.TIUN_SANDBOX_PRODUCT_FIXFLOW : env.TIUN_PRODUCT_FIXFLOW,
      },
      {
        key: "solofix",
        name: "Solo Fix",
        blurb: "One finding a month fixed for you, as a patch carrying a test that fails before and passes after. The cheap way in.",
        id: sandbox ? env.TIUN_SANDBOX_PRODUCT_SOLOFIX : env.TIUN_PRODUCT_SOLOFIX,
      },
    ].filter((p) => Boolean(p.id)),
  };
}

/** Exchanges the browser's short-lived token for a user. The key stays here. */
async function verify(token, cfg) {
  if (!cfg.apiKey) {
    return { ok: false, error: `${cfg.sandbox ? "TIUN_SANDBOX_API_KEY" : "TIUN_API_KEY"} is not set on the server` };
  }
  const res = await fetch(`${cfg.base}/live_api/s2s/v1/users/verification`, {
    method: "POST",
    headers: { "X-TIUN-API-KEY": cfg.apiKey, "content-type": "application/json" },
    body: JSON.stringify({ userVerificationToken: token }),
  });
  if (!res.ok) return { ok: false, error: `tiun returned ${res.status}` };
  const body = await res.json();
  return { ok: Boolean(body.isAuthenticated), user: body.userInfo ?? null };
}

/** Signs with WebCrypto. Same key, same bytes, same token as the local server. */
async function signLicence(payload, privateKeyDerBase64) {
  const key = await crypto.subtle.importKey("pkcs8", decode(privateKeyDerBase64), { name: "Ed25519" }, false, ["sign"]);
  const body = bodyOf(payload);
  const signature = await crypto.subtle.sign({ name: "Ed25519" }, key, bytesToSign(body));
  return tokenOf(body, new Uint8Array(signature));
}

/**
 * Turns "Tiun says this user has paid" into a licence the CLI checks offline.
 * `productAccess` is Tiun's own record of what was bought, so the entitlement
 * decision stays theirs and this only writes it down in a portable form.
 */
export async function licenceFor(user, cfg) {
  const owned = Object.keys(user?.productAccess ?? {});
  if (owned.length === 0) return { ok: false, status: 402, error: "this account has not bought anything yet" };
  // Map Tiun ids back to our own names, so a token never carries an id that
  // changes when the live products are created, then expand each one into what it
  // grants. A licence lists capabilities, not purchases.
  const bought = cfg.products.filter((p) => owned.includes(p.id)).map((p) => p.key);
  const products = granted(bought);
  if (products.length === 0) {
    return { ok: false, status: 402, error: "the products on this account are not ones this build knows about" };
  }
  if (!cfg.signingKey) {
    return { ok: false, status: 500, error: "MARGYN_LICENCE_KEY is not set on the server, so no licence can be signed" };
  }
  const expires = Date.now() + LICENCE_DAYS * 86_400_000;
  const licence = await signLicence({ product: products, email: user.email ?? null, issued: Date.now(), expires }, cfg.signingKey);
  return { ok: true, licence, products, expires };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cfg = config(env);

    if (url.pathname === "/api/config") {
      // The snippet id is a public client value. The API key is not, and is absent here.
      // `scan: false` tells the page there is no scan route on this host.
      return json({ snippetId: cfg.snippetId ?? null, sandbox: cfg.sandbox, products: cfg.products, scan: false });
    }

    if (url.pathname === "/api/fix-intake") {
      if (request.method !== "POST") return json({ error: "use POST" }, 405);
      let body;
      try {
        body = await readBody(request);
      } catch (e) {
        return json({ error: String(e.message ?? e) }, 400);
      }
      // Prepares a fix request from the finding alone. It stores nothing and
      // reads no repository, so there is no source to leak and no data to guard.
      const result = intake(body);
      const { status, ...rest } = result;
      return json(rest, status);
    }

    if (url.pathname === "/api/suggest") {
      if (request.method !== "POST") return json({ error: "use POST" }, 405);
      let body;
      try {
        body = await readBody(request);
      } catch (e) {
        return json({ error: String(e.message ?? e) }, 400);
      }
      // Prepares a prefilled issue and returns it. It stores nothing, sends
      // nothing and reads nothing, so a suggestion cannot become a database we
      // are then holding on someone else's behalf.
      const { status, ...rest } = suggest(body);
      return json(rest, status);
    }

    if (url.pathname === "/api/verify" || url.pathname === "/api/licence") {
      if (request.method !== "POST") return json({ error: "use POST" }, 405);
      let token;
      try {
        ({ token } = await readBody(request));
      } catch (e) {
        return json({ error: String(e.message ?? e) }, 400);
      }
      if (!token) return json({ error: "token is required" }, 400);

      const seen = await verify(token, cfg);
      if (url.pathname === "/api/verify") return json(seen);
      if (!seen.ok) return json({ error: seen.error ?? "not authenticated with tiun" }, 401);
      const minted = await licenceFor(seen.user, cfg);
      return minted.ok ? json(minted) : json({ error: minted.error }, minted.status);
    }

    // Everything else is the frontend, bundled into this script. Pages are served
    // without their extension, so `/pricing` finds `pricing.html` while an asset
    // is still looked up by its exact name. A path that matches neither is a 404
    // rather than the home page, so a typo in an asset URL fails loudly instead
    // of returning HTML to something expecting a module.
    const clean = url.pathname === "/" ? "/index.html" : url.pathname.replace(/\/+$/, "");
    const asset = STATIC[clean] ?? STATIC[`${clean}.html`];
    if (!asset) {
      const missing = STATIC["/404.html"];
      return missing
        ? new Response(missing.body, {
            status: 404,
            headers: { "content-type": missing.type, "cache-control": "no-store" },
          })
        : new Response("not found", { status: 404 });
    }
    // Images are stored base64 and decoded here. Serving the base64 text would be
    // a 200 with a broken body, which is worse than a 404.
    const body = asset.binary ? Uint8Array.from(atob(asset.body), (c) => c.charCodeAt(0)) : asset.body;
    return new Response(body, {
      headers: {
        "content-type": asset.type,
        // Short on the page, because the page and the API deploy together and a
        // stale page against a new API is the one failure this design rules out.
        // Long on the images, which are content-addressed by their own bytes.
        "cache-control": asset.binary ? "public, max-age=604800" : "public, max-age=60",
      },
    });
  },
};
