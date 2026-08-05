/**
 * Frontend. The SDK loads from a CDN so the page needs no build step, which keeps
 * the whole app two files. Swap to `npm install @tiun/sdk` when this grows a
 * bundler.
 *
 * Two jobs, and nothing else: resolve the session into the top bar without the
 * layout jumping, and hand a paying user their CLI licence. Scanning is not here
 * and never will be, because the scanner is a local CLI.
 */
const el = (id) => document.getElementById(id);
const out = el("out");
const escape = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

/* ---- theme. The radios set color-scheme on the root and light-dark() reads it,
   so the OS path needs no listener and a manual choice is one declaration. ---- */
const THEME_KEY = "margyn-theme";
const root = document.documentElement;
let stored = null;
try { stored = localStorage.getItem(THEME_KEY); } catch {}
const chosen = el(stored === "light" ? "t-light" : stored === "dark" ? "t-dark" : "t-sys");
if (chosen) chosen.checked = true;
for (const input of document.querySelectorAll(".theme input")) {
  input.addEventListener("change", () => {
    const v = input.value;
    root.style.colorScheme = v === "system" ? "" : v;
    try { v === "system" ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, v); } catch {}
  });
}

/* ---- copy the install command. The clipboard can be unavailable or denied, so
   the failure path tells the user what to do instead of failing silently. ---- */
const copy = el("copy");
copy?.addEventListener("click", async () => {
  const text = el(copy.dataset.copy).textContent.trim();
  const done = (label) => {
    copy.textContent = label;
    setTimeout(() => { copy.textContent = "Copy"; }, 1600);
  };
  try {
    await navigator.clipboard.writeText(text);
    done("Copied");
  } catch {
    // Select it so the keyboard shortcut works, then say so.
    const range = document.createRange();
    range.selectNodeContents(el(copy.dataset.copy));
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    done("Press Ctrl+C");
  }
});

/* ---- session. Everything below needs the SDK, and the page is fully useful
   without it, so a CDN failure must not take the page down with it. ---- */
/**
 * Says so when checkout cannot load, rather than leaving a button that does
 * nothing. The pricing page is where someone decides to pay, so a silent dead
 * control there is worse than an honest message.
 */
function checkoutUnavailable(why) {
  who.textContent = why;
  const note = el("buynote");
  if (note) note.textContent = "Checkout cannot load right now. The free scan needs no account. The price is unchanged at $8.99 a month.";
  for (const id of ["buylogin", "buy"]) el(id)?.setAttribute("disabled", "");
}

const cfg = await (await fetch("/api/config")).json().catch(() => ({}));
const who = el("who");

if (!cfg.snippetId) {
  checkoutUnavailable("");
  throw new Error("no snippet id configured");
}

let tiun;
try {
  ({ tiun } = await import("https://esm.sh/@tiun/sdk@0.9.1"));
  tiun.init({ snippetId: cfg.snippetId, sandbox: cfg.sandbox, language: "en" });
  await tiun.waitForReady();
} catch {
  // The free scan is a CLI, so a dead CDN costs the visitor nothing they came for.
  checkoutUnavailable("sign in unavailable");
  throw new Error("tiun sdk did not load");
}

const watch = (cfg.products ?? []).find((p) => p.key === "watch");

/** One place decides what the bar looks like, so the state cannot drift. */
async function paint() {
  const user = await tiun.getUser().catch(() => null);
  const signedIn = Boolean(user?.isAuthenticated ?? user?.email);
  const access = Object.keys(user?.productAccess ?? {}).length > 0;

  who.textContent = signedIn ? (user.email ?? "signed in") : "";
  el("login").hidden = signedIn;
  el("logout").hidden = !signedIn;
  // The licence is only worth offering to someone who bought something, since
  // minting one for a free account can only ever be refused.
  el("licence").hidden = !access;
  // Two buttons, one visible at a time: signed out gets sign in, signed in and
  // unpaid gets checkout, paid gets neither because the licence button appears.
  const buy = el("buy");
  const buylogin = el("buylogin");
  if (buy) buy.hidden = !signedIn || access || !watch;
  if (buylogin) buylogin.hidden = signedIn;
  const note = el("buynote");
  if (note) {
    note.textContent = access
      ? "You have Watch. Get your licence from the top bar."
      : "3 days free, then $8.99 a month. Checkout runs on Tiun.";
  }
}

el("login").onclick = () => tiun.login();
el("logout").onclick = async () => { await tiun.logout(); paint(); };
el("buy")?.addEventListener("click", () => tiun.checkout({ productId: watch.id }));
el("buylogin")?.addEventListener("click", () => tiun.login());

/**
 * Hands over the CLI licence. Shown rather than downloaded: what the user needs
 * is one line to paste into a file or a CI secret, and a downloaded file in the
 * wrong place is a support ticket.
 */
el("licence").onclick = async () => {
  const button = el("licence");
  button.disabled = true;
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
    out.innerHTML = `<div class="panel">
      <p class="meta">licence &middot; ${escape(body.products.join(", "))} &middot; valid until ${until}</p>
      <h3>Save this as <code>~/.margyn/licence</code></h3>
      <p>Or set it as <code>MARGYN_LICENCE</code> in CI. It is checked offline, so a runner with
        no network still verifies it. It expires on ${until}. A renewed subscription mints a
        new one.</p>
      <pre>${escape(body.licence)}</pre>
    </div>`;
  } catch (error) {
    out.innerHTML = `<div class="panel" role="alert"><p>${escape(error.message ?? error)}</p></div>`;
  } finally {
    button.disabled = false;
  }
};

for (const event of ["login", "logout", "checkout:complete", "user:updated"]) tiun.on?.(event, paint);
paint();
