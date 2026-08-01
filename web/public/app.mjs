/**
 * Frontend. The SDK is loaded from a CDN so the page needs no build step, which
 * keeps the whole app three files. Swap to `npm install @tiun/sdk` when this
 * grows a bundler.
 */
import { tiun } from "https://esm.sh/@tiun/sdk@0.9.1";

const el = (id) => document.getElementById(id);
const out = el("out");

const cfg = await (await fetch("/api/config")).json();
if (!cfg.snippetId) {
  out.innerHTML = `<div class="empty">No snippet id on the server. Set <code>TIUN_SANDBOX_SNIPPET_ID</code> and restart.</div>`;
  throw new Error("missing snippetId");
}

tiun.init({ snippetId: cfg.snippetId, sandbox: cfg.sandbox, language: "en" });
await tiun.waitForReady();

/** One place decides what the buttons look like, so state can never drift. */
async function paint() {
  const user = await tiun.getUser().catch(() => null);
  const signedIn = Boolean(user?.isAuthenticated ?? user?.email);
  const access = Object.keys(user?.productAccess ?? {}).length > 0;

  el("who").textContent = signedIn
    ? `${user.email ?? "signed in"}${access ? " · scanning unlocked" : " · no product yet"}`
    : "not signed in";
  el("login").hidden = signedIn;
  el("logout").hidden = !signedIn;
  el("buy").hidden = !signedIn || access;
  el("scan").disabled = !signedIn;
  return { signedIn, access };
}

el("login").onclick = () => tiun.login();
el("logout").onclick = async () => { await tiun.logout(); paint(); };
el("buy").onclick = () => {
  const productId = cfg.productId ?? window.prompt("Tiun product id for the Fix pack");
  if (productId) tiun.checkout({ productId });
};

for (const event of ["login", "logout", "checkout:complete", "user:updated"]) {
  tiun.on?.(event, paint);
}

el("scan").onclick = async () => {
  const target = el("target").value.trim();
  if (!target) return;
  el("scan").disabled = true;
  out.innerHTML = `<div class="empty">scanning ${target}…</div>`;
  try {
    const token = await tiun.getUserVerificationToken();
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, target }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? `server returned ${res.status}`);
    render(body);
  } catch (error) {
    out.innerHTML = `<div class="empty">${escape(String(error.message ?? error))}</div>`;
  } finally {
    el("scan").disabled = false;
  }
};

const escape = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function render({ root, findings }) {
  if (findings.length === 0) {
    out.innerHTML = `<div class="empty">Nothing hollow found in ${escape(root)}. Every check this tool knows how to test held up.</div>`;
    return;
  }
  out.innerHTML = findings
    .map(
      (f) => `<div class="f">
        <p class="meta">${escape(f.severity)} · ${escape(f.check)} · ${escape(f.file)}</p>
        <h3>${escape(f.summary)}</h3>
        <p class="why">${escape(f.why)}</p>
        <pre>${escape(f.reproduction.join("\n"))}</pre>
      </div>`,
    )
    .join("");
}

paint();
