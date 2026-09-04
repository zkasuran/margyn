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
  for (const button of document.querySelectorAll("[data-buy], [data-signin]")) {
    button.setAttribute("disabled", "");
    button.removeAttribute("aria-busy");
    button.title = "Checkout could not load";
  }
  mark(why === "checkout blocked" ? "blocked" : "unavailable");
}

/**
 * `waitForReady()` resolving is not proof the SDK works.
 *
 * The module comes from esm.sh, then it fetches its own stylesheet and its own
 * runtime bundle from the API host. Block those two and `waitForReady()` still
 * resolves, `getUser()` still answers, so every control paints as live and does
 * nothing when clicked. That is what shipped from 2026-08-06: a page-level check
 * that passed while the thing it checks was broken, which is the exact fault this
 * product exists to find.
 *
 * A blocked subresource never reaches the Resource Timing buffer, so asking the
 * buffer for the runtime bundle is a real answer rather than a hopeful one. The
 * CSP violation listener names the cause when there is one, so the message on the
 * page can say "blocked here" instead of "unavailable somewhere".
 */
const CSP_BLOCKED = "tiun assets blocked by this page's content security policy";
/** A blocked font is ugly. A blocked script, style or frame is a dead checkout. */
const FATAL_DIRECTIVES = new Set(["script-src", "style-src", "frame-src", "connect-src"]);
let cspBlocked = null;
document.addEventListener("securitypolicyviolation", (e) => {
  const directive = String(e.effectiveDirective || e.violatedDirective || "");
  if (!String(e.blockedURI || "").includes("tiun")) return;
  if (FATAL_DIRECTIVES.has(directive)) cspBlocked = `${directive} blocked ${e.blockedURI}`;
});

function assertSdkArrived() {
  if (cspBlocked) throw new Error(CSP_BLOCKED);
  const loaded = performance
    .getEntriesByType("resource")
    .some((r) => r.name.includes("/background_js") && r.responseEnd > 0);
  if (!loaded) throw new Error("tiun runtime bundle never loaded");
  if (typeof tiun.login !== "function" || typeof tiun.checkout !== "function") {
    throw new Error("tiun sdk is missing login or checkout");
  }
}

/**
 * The page says out loud what state its checkout is in, on the root element, so the
 * answer is readable from outside rather than inferred. `loading` until the SDK is
 * proven up, then `ready`, or `blocked` when the policy refused its assets and
 * `unavailable` when it failed some other way. A gate you cannot observe is a gate
 * you cannot trust, which is the whole argument this product makes.
 */
function mark(state) {
  document.documentElement.dataset.tiunState = state;
}

/**
 * Sign in and buy controls start dead and are woken by `paint()` once the SDK is
 * genuinely ready. That order matters. The HTML used to ship them live, so while the
 * module was stuck waiting on a snippet that never arrived, the pricing page offered
 * a button that took the click and dropped it. Disabled first means the worst case is
 * a control that is visibly not ready, never one that lies.
 */
function armControls(on) {
  for (const button of document.querySelectorAll("[data-buy], [data-signin]")) {
    if (on) {
      button.removeAttribute("disabled");
      button.removeAttribute("aria-busy");
      button.removeAttribute("title");
    } else {
      button.setAttribute("disabled", "");
      button.setAttribute("aria-busy", "true");
      button.title = "Checkout is still loading";
    }
  }
}

const cfg = await (await fetch("/api/config")).json().catch(() => ({}));
const who = el("who");
mark("loading");
armControls(false);

/**
 * Says which Tiun environment the buttons are wired to. Sandbox means a card is
 * not charged, which someone about to press a buy button is owed rather than
 * left to discover. It disappears on its own when the server reports live.
 */
const sandboxNote = el("sandboxnote");
if (sandboxNote && cfg.sandbox) {
  sandboxNote.textContent =
    "Checkout is running in Tiun's sandbox while the live account finishes onboarding, so no card is charged yet. The price and the trial above are the real ones.";
  sandboxNote.hidden = false;
}

if (!cfg.snippetId) {
  checkoutUnavailable("");
  throw new Error("no snippet id configured");
}

let tiun;
try {
  ({ tiun } = await import("https://esm.sh/@tiun/sdk@0.9.1"));
  tiun.init({ snippetId: cfg.snippetId, sandbox: cfg.sandbox, language: "en" });
  await tiun.waitForReady();
  assertSdkArrived();
  mark("ready");
  armControls(true);
} catch (err) {
  // The free scan is a CLI, so a dead CDN costs the visitor nothing they came for.
  checkoutUnavailable(err?.message === CSP_BLOCKED ? "checkout blocked" : "sign in unavailable");
  throw new Error("tiun sdk did not load");
}

const byKey = new Map((cfg.products ?? []).map((p) => [p.key, p]));

/**
 * Every buy control carries the product it buys, so the pricing page can offer
 * three of them without this file knowing the page's layout. A control whose
 * product is not configured on the server is disabled with the reason, rather
 * than left to open an empty checkout.
 */
for (const button of document.querySelectorAll("[data-buy]")) {
  const product = byKey.get(button.dataset.buy);
  if (!product) {
    button.disabled = true;
    button.title = "This plan is not configured on the server yet";
    continue;
  }
  button.addEventListener("click", () => tiun.checkout({ productId: product.id }));
}

/**
 * Normalises what the SDK hands back, because two things about it are easy to get
 * wrong and we got both wrong.
 *
 * `getUser()` is synchronous. It returns a plain object, so `getUser().catch(...)`
 * is a TypeError, and an async function that throws synchronously becomes a
 * rejected promise nobody is awaiting. `paint()` failed that way on every call
 * from 2026-08-06, which is why the top bar never resolved and why the buy
 * controls stayed in whatever state the HTML shipped with.
 *
 * The shape is `{isAuthenticated, user}`, so the email and the purchases live one
 * level down. Reading `productAccess` off the top level always gave an empty
 * object, so the licence button could never appear, not even for someone who had
 * paid. Both levels are read here: the nested one is what @tiun/sdk@0.9.1 sends,
 * the flat one is a cheap hedge if a later version flattens it.
 */
function readUser() {
  let raw;
  try {
    raw = tiun.getUser();
  } catch {
    return { signedIn: false, email: null, access: [] };
  }
  const inner = raw?.user ?? null;
  const access = Object.keys(inner?.productAccess ?? raw?.productAccess ?? {});
  return {
    signedIn: Boolean(raw?.isAuthenticated ?? inner?.email ?? raw?.email),
    email: inner?.email ?? raw?.email ?? null,
    access,
  };
}

/** One place decides what the bar looks like, so the state cannot drift. */
function paint() {
  const { signedIn, email, access } = readUser();

  who.textContent = signedIn ? (email ?? "signed in") : "";
  el("login").hidden = signedIn;
  el("logout").hidden = !signedIn;
  // The licence is only worth offering to someone who bought something, since
  // minting one for a free account can only ever be refused.
  el("licence").hidden = access.length === 0;
  // Signed out, every buy control becomes a sign-in prompt instead, because
  // checkout needs an account and a dead button is worse than a redirect.
  for (const button of document.querySelectorAll("[data-buy]")) button.hidden = !signedIn;
  for (const button of document.querySelectorAll("[data-signin]")) button.hidden = signedIn;
  const note = el("buynote");
  if (note) {
    note.textContent = access.length
      ? "You already have a plan. Get your licence from the top bar."
      : "3 days free on Watch and Team, then the price above. Checkout runs on Tiun.";
  }
}

el("login").onclick = () => tiun.login();
el("logout").onclick = async () => { await tiun.logout(); paint(); };
el("buylogin")?.addEventListener("click", () => tiun.login());
for (const button of document.querySelectorAll("[data-signin]")) {
  button.addEventListener("click", () => tiun.login());
}

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

/**
 * Repaint on the events the SDK actually emits.
 *
 * The first version listened for `checkout:complete` and `user:updated`. Neither
 * exists. @tiun/sdk@0.9.1 emits exactly seven: ready, login, logout, userChange,
 * paywallShow, paywallHide, error. So a completed purchase changed nothing on the
 * page: the buy button stayed a buy button and the licence control stayed hidden
 * until a manual reload. `userChange` is the one that carries a new purchase, and
 * `paywallHide` is the closest thing to "the checkout closed", so both are here.
 * test/frontend-sdk.test.mjs holds this list to the SDK's own names.
 */
const SDK_EVENTS = ["login", "logout", "userChange", "paywallHide"];
for (const event of SDK_EVENTS) tiun.on?.(event, paint);
paint();
