/**
 * Margyn web: the smallest honest surface that shows the product working.
 *
 * Serves the frontend, and owns the three things a browser must not:
 *   POST /api/verify   exchanges the SDK's userVerificationToken for a user
 *                      object, using the secret API key. This is the only place
 *                      the key is ever read.
 *   POST /api/licence  mints a signed licence for a user Tiun says has paid.
 *                      The private key lives here and never leaves.
 *   POST /api/scan     runs the scanner, gated on that verification. LOCAL ONLY:
 *                      it takes a path from the caller, so it is deliberately
 *                      absent from the deployed worker. Scanning belongs on the
 *                      user's machine.
 *
 * Zero dependencies beyond the SDK the frontend loads. Node 22 or newer.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { granted } from "../src/entitlements.mjs";
import { intake } from "../src/fix-intake.mjs";
import { suggest } from "../src/suggest.mjs";
import { mintLicence } from "../src/licence.mjs";
import { scan } from "../src/scan.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(here, "public");
const PORT = Number(process.env.PORT ?? 3000);

/** Loads .env without a dependency, and never overrides a real environment. */
for (const candidate of [join(here, "..", "..", "tiun-hackathon", ".env"), join(here, ".env")]) {
  if (!existsSync(candidate)) continue;
  for (const line of readFileSync(candidate, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SANDBOX = process.env.TIUN_ENV !== "live";
// Keys are environment-scoped, verified 2026-08-01: the sandbox key returns 200
// on api-sandbox and 401 on api.tiun.live, and the live key does the reverse.
// So picking the wrong one fails closed rather than quietly charging money.
const API_KEY = SANDBOX ? process.env.TIUN_SANDBOX_API_KEY : process.env.TIUN_API_KEY;
const SNIPPET_ID = SANDBOX ? process.env.TIUN_SANDBOX_SNIPPET_ID : process.env.TIUN_SNIPPET_ID;
/**
 * Product ids are per environment: `p-test-` only works with `sandbox: true`,
 * `p-live-` only without it. Kept in env so the live switch is configuration
 * rather than a code change.
 */
const PRODUCTS = [
  {
    key: "watch",
    name: "Watch",
    blurb: "Continuous auditing plus a CI gate that fails the build when a check goes hollow. Unlocks the mutation proof in the CLI.",
    id: SANDBOX ? process.env.TIUN_SANDBOX_PRODUCT_WATCH : process.env.TIUN_PRODUCT_WATCH,
  },
  {
    key: "team",
    name: "Team",
    blurb: "Watch for every repository the organisation owns, priority on issues, invoices on request.",
    id: SANDBOX ? process.env.TIUN_SANDBOX_PRODUCT_TEAM : process.env.TIUN_PRODUCT_TEAM,
  },
  {
    key: "fixflow",
    name: "Fix flow",
    blurb: "Up to three findings a month fixed for you, each as a patch carrying a test that fails before and passes after.",
    id: SANDBOX ? process.env.TIUN_SANDBOX_PRODUCT_FIXFLOW : process.env.TIUN_PRODUCT_FIXFLOW,
  },
  {
    key: "solofix",
    name: "Solo Fix",
    blurb: "One finding a month fixed for you, as a patch carrying a test that fails before and passes after. The cheap way in.",
    id: SANDBOX ? process.env.TIUN_SANDBOX_PRODUCT_SOLOFIX : process.env.TIUN_PRODUCT_SOLOFIX,
  },
].filter((p) => Boolean(p.id));
const API_BASE = SANDBOX ? "https://api-sandbox.tiun.live" : "https://api.tiun.live";
// The path prefix is `live_api` on both hosts, and the SDK source confirms it:
// @tiun/sdk@0.9.1 hardcodes "https://api.tiun.live/live_api" and
// "https://api-sandbox.tiun.live/live_api", picking between them on the sandbox
// flag. So the environment is the hostname plus which key you hold, never the
// path. Probing agrees: the sandbox host answers `live_api` with 401 for a
// wrong key and `sandbox_api` with 404.
const API_PREFIX = "live_api";
/** Signs licences. Server-side only, and absent in a build that cannot mint. */
const SIGNING_KEY = process.env.MARGYN_LICENCE_KEY;

const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png", ".ico": "image/x-icon" };

const json = (res, code, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
};

const BODY_CAP = 64_000;

/**
 * Reads a JSON body, in bytes rather than in string concatenation.
 *
 * `raw += chunk` decodes each chunk on its own, so a multi-byte character split
 * across two TCP packets arrives as U+FFFD. For a free-text feedback box that is
 * the common case rather than the edge one. Over the cap the socket is destroyed
 * instead of being left to keep arriving after the answer has been sent.
 */
const readBody = (req) =>
  new Promise((ok, fail) => {
    const type = req.headers["content-type"] ?? "";
    if (!type.includes("application/json")) {
      fail(Object.assign(new Error("send content-type: application/json"), { status: 415 }));
      return;
    }
    const chunks = [];
    let size = 0;
    let done = false;
    // Pause rather than destroy: the caller still has to be able to read the answer,
    // and the route destroys the socket once it has sent it.
    const stop = (error) => {
      if (done) return;
      done = true;
      req.pause();
      fail(error);
    };
    req.on("data", (c) => {
      if (done) return;
      size += c.length;
      if (size > BODY_CAP) return stop(Object.assign(new Error("body too large"), { status: 413 }));
      chunks.push(c);
    });
    req.on("error", stop);
    req.on("end", () => {
      if (done) return;
      done = true;
      const raw = Buffer.concat(chunks).toString("utf8");
      try { ok(raw ? JSON.parse(raw) : {}); } catch (e) { fail(e); }
    });
  });

/** Exchanges the browser's short-lived token for a user, server-side only. */
async function verify(token) {
  if (!API_KEY) return { ok: false, error: `${SANDBOX ? "TIUN_SANDBOX_API_KEY" : "TIUN_API_KEY"} is not set on the server` };
  const res = await fetch(`${API_BASE}/${API_PREFIX}/s2s/v1/users/verification`, {
    method: "POST",
    headers: { "X-TIUN-API-KEY": API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ userVerificationToken: token }),
  });
  if (!res.ok) return { ok: false, error: `tiun returned ${res.status}` };
  const body = await res.json();
  return { ok: Boolean(body.isAuthenticated), user: body.userInfo ?? null };
}

/** A licence lasts 31 days, so a lapsed subscription stops working on its own. */
const LICENCE_DAYS = 31;

/**
 * Turns "Tiun says this user has paid" into a signed licence the CLI can check
 * offline. `productAccess` is Tiun's own record of what was bought, so the
 * entitlement decision is theirs and this only writes it down in a form that
 * survives being carried to a CI runner with no network.
 */
function licenceFor(user) {
  const owned = Object.keys(user?.productAccess ?? {});
  if (owned.length === 0) return { ok: false, error: "this account has not bought anything yet" };
  // Map Tiun product ids back to our own names, so the token never carries an id
  // that changes when the live products are created, then expand each purchase
  // into what it grants. A licence lists capabilities rather than purchases.
  const bought = PRODUCTS.filter((p) => owned.includes(p.id)).map((p) => p.key);
  const products = granted(bought);
  if (products.length === 0) return { ok: false, error: "the products on this account are not ones this build knows about" };
  if (!SIGNING_KEY) return { ok: false, error: "MARGYN_LICENCE_KEY is not set on the server, so no licence can be signed" };
  const expires = Date.now() + LICENCE_DAYS * 86_400_000;
  return {
    ok: true,
    licence: mintLicence({ product: products, email: user.email ?? null, issued: Date.now(), expires }, SIGNING_KEY),
    products,
    expires,
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/config") {
    // The snippet id is a public client value. The API key is not, and is absent here.
    return json(res, 200, { snippetId: SNIPPET_ID ?? null, sandbox: SANDBOX, products: PRODUCTS });
  }

  if (url.pathname === "/api/verify" && req.method === "POST") {
    try {
      const { token } = await readBody(req);
      if (!token) return json(res, 400, { error: "token is required" });
      return json(res, 200, await verify(token));
    } catch (e) {
      return json(res, 400, { error: String(e.message ?? e) });
    }
  }

  if (url.pathname === "/api/licence" && req.method === "POST") {
    try {
      const { token } = await readBody(req);
      if (!token) return json(res, 400, { error: "token is required" });
      const seen = await verify(token);
      if (!seen.ok) return json(res, 401, { error: seen.error ?? "not authenticated with tiun" });
      const minted = licenceFor(seen.user);
      return json(res, minted.ok ? 200 : 402, minted.ok ? minted : { error: minted.error });
    } catch (e) {
      return json(res, 400, { error: String(e.message ?? e) });
    }
  }

  // Both prepare-a-link routes answer the way the Worker answers, including 405 on
  // the wrong method. They used to fall through to the static handler, so a client
  // debugging against the dev server got a 404 HTML page where production sends
  // JSON.
  for (const [path, prepare] of [["/api/fix-intake", intake], ["/api/suggest", suggest]]) {
    if (url.pathname !== path) continue;
    if (req.method !== "POST") return json(res, 405, { error: "use POST" });
    try {
      const { status, ...rest } = prepare(await readBody(req));
      return json(res, status, rest);
    } catch (e) {
      const answered = json(res, e.status ?? 400, { error: String(e.message ?? e) });
      // The upload is still arriving on an oversized body, so hang up now that the
      // reason has been sent.
      if (e.status === 413) req.destroy();
      return answered;
    }
  }

  if (url.pathname === "/api/scan" && req.method === "POST") {
    try {
      const { token, target } = await readBody(req);
      const seen = await verify(token ?? "");
      if (!seen.ok) return json(res, 401, { error: "not authenticated with tiun" });
      const root = resolve(target ?? ".");
      if (!existsSync(join(root, ".git"))) return json(res, 400, { error: `${root} is not a git repository` });
      const findings = scan(root);
      return json(res, 200, { root, findings, scannedBy: seen.user?.email ?? null });
    } catch (e) {
      return json(res, 500, { error: String(e.message ?? e) });
    }
  }

  // Pages are served without their extension, the same way the deployed worker
  // does it, so a link that works here cannot 404 in production.
  const file = url.pathname === "/" ? "index.html" : url.pathname.replace(/\/+$/, "").slice(1);
  const candidates = [join(PUBLIC, file), join(PUBLIC, `${file}.html`)];
  const abs = candidates.find((p) => p.startsWith(PUBLIC) && existsSync(p) && !p.endsWith("/"));
  if (!abs) {
    const missing = join(PUBLIC, "404.html");
    if (existsSync(missing)) {
      res.writeHead(404, { "content-type": "text/html" });
      res.end(readFileSync(missing));
      return;
    }
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(abs)] ?? "application/octet-stream" });
  res.end(readFileSync(abs));
});

/**
 * Loopback only, deliberately. This server has a scan route, which takes a
 * filesystem path and runs git against it. The whole reason that route is allowed
 * to exist here is that the caller and the repository are the same machine.
 * Binding every interface quietly made that untrue on any shared network.
 */
server.listen(PORT, "127.0.0.1", () => {
  console.log(`margyn web  http://localhost:${PORT}`);
  console.log(`  tiun env   ${SANDBOX ? "sandbox" : "LIVE"}  (${API_BASE})`);
  console.log(`  snippet    ${SNIPPET_ID ? `${SNIPPET_ID.slice(0, 8)}...` : "MISSING, set TIUN_SANDBOX_SNIPPET_ID"}`);
  console.log(`  api key    ${API_KEY ? "loaded, server-side only" : "MISSING, /api/verify will refuse"}`);
  console.log(`  signing    ${SIGNING_KEY ? "loaded, server-side only" : "MISSING, /api/licence will refuse"}`);
  console.log(`  products   ${PRODUCTS.length ? PRODUCTS.map((p) => `${p.name}=${p.id}`).join("  ") : "none configured"}`);
});
