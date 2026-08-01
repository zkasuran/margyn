/**
 * Placebo web: the smallest honest surface that shows the product working.
 *
 * Serves the frontend, and owns the two things a browser must not:
 *   POST /api/verify  exchanges the SDK's userVerificationToken for a user
 *                     object, using the secret API key. This is the only place
 *                     the key is ever read.
 *   POST /api/scan    runs the scanner, gated on that verification.
 *
 * Zero dependencies beyond the SDK the frontend loads. Node 22 or newer.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const API_KEY = process.env.TIUN_API_KEY;
const SNIPPET_ID = process.env.TIUN_SANDBOX_SNIPPET_ID;
const SANDBOX = process.env.TIUN_ENV !== "live";
const API_BASE = SANDBOX ? "https://api-sandbox.tiun.live" : "https://api.tiun.live";
// The path prefix is `live_api` on both hosts. Probed 2026-08-01: the sandbox
// host answers `live_api` with 401 when the key is wrong, and `sandbox_api`
// with 404, so the environment is chosen by hostname and by which key you hold.
const API_PREFIX = "live_api";

const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

const json = (res, code, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
};

const readBody = (req) =>
  new Promise((ok, fail) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 64_000) fail(new Error("body too large"));
    });
    req.on("end", () => {
      try { ok(raw ? JSON.parse(raw) : {}); } catch (e) { fail(e); }
    });
  });

/** Exchanges the browser's short-lived token for a user, server-side only. */
async function verify(token) {
  if (!API_KEY) return { ok: false, error: "TIUN_API_KEY is not set on the server" };
  const res = await fetch(`${API_BASE}/${API_PREFIX}/s2s/v1/users/verification`, {
    method: "POST",
    headers: { "X-TIUN-API-KEY": API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ userVerificationToken: token }),
  });
  if (!res.ok) return { ok: false, error: `tiun returned ${res.status}` };
  const body = await res.json();
  return { ok: Boolean(body.isAuthenticated), user: body.userInfo ?? null };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/config") {
    // The snippet id is a public client value. The API key is not, and is absent here.
    return json(res, 200, { snippetId: SNIPPET_ID ?? null, sandbox: SANDBOX });
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

  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const abs = join(PUBLIC, file);
  if (!abs.startsWith(PUBLIC) || !existsSync(abs)) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(abs)] ?? "application/octet-stream" });
  res.end(readFileSync(abs));
});

server.listen(PORT, () => {
  console.log(`placebo web  http://localhost:${PORT}`);
  console.log(`  tiun env   ${SANDBOX ? "sandbox" : "LIVE"}  (${API_BASE})`);
  console.log(`  snippet    ${SNIPPET_ID ? `${SNIPPET_ID.slice(0, 8)}...` : "MISSING, set TIUN_SANDBOX_SNIPPET_ID"}`);
  console.log(`  api key    ${API_KEY ? "loaded, server-side only" : "MISSING, /api/verify will refuse"}`);
});
