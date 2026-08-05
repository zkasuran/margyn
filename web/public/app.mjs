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
  for (const b of document.querySelectorAll("[data-product]")) b.hidden = !signedIn || access;
  // The licence is only worth offering to someone who has actually bought
  // something, since minting one for a free account can only ever be refused.
  el("licence").hidden = !access;
  el("scan").disabled = !signedIn;
  return { signedIn, access };
}

el("login").onclick = () => tiun.login();
el("logout").onclick = async () => { await tiun.logout(); paint(); };

/**
 * Hands over the CLI licence. Shown rather than downloaded: the copy the user
 * needs is one line they paste into a file or a CI secret, and a downloaded file
 * in the wrong place is a support ticket.
 */
el("licence").onclick = async () => {
  el("licence").disabled = true;
  try {
    const token = await tiun.getUserVerificationToken();
    const res = await fetch("/api/licence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? `server returned ${res.status}`);
    const until = new Date(body.expires).toISOString().slice(0, 10);
    out.innerHTML = `<div class="f">
      <p class="meta">licence · ${escape(body.products.join(", "))} · valid until ${until}</p>
      <h3>Save this as <code>~/.margyn/licence</code></h3>
      <p class="why">Or set it as <code>MARGYN_LICENCE</code> in CI. It is checked offline, so a runner
        with no network still verifies it. It expires on ${until}, and a renewed subscription mints a new one.</p>
      <pre>${escape(body.licence)}</pre>
    </div>`;
  } catch (error) {
    out.innerHTML = `<div class="empty">${escape(String(error.message ?? error))}</div>`;
  } finally {
    el("licence").disabled = false;
  }
};
/** One button per configured product, so nothing is prompted for at runtime. */
function mountBuyButtons() {
  const host = el("buy").parentElement;
  for (const product of cfg.products ?? []) {
    const b = document.createElement("button");
    b.textContent = `Buy ${product.name}`;
    b.title = product.blurb;
    b.dataset.product = product.key;
    b.onclick = () => tiun.checkout({ productId: product.id });
    host.insertBefore(b, el("logout"));
  }
  el("buy").remove();
}
mountBuyButtons();

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
