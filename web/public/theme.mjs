/**
 * Theme and copy, for the pages that carry no session.
 *
 * The home and pricing pages load app.mjs, which does this plus the Tiun SDK.
 * Every other page needs only these two behaviours, so it does not pay for the
 * SDK import to read documentation.
 */
const THEME_KEY = "margyn-theme";
const root = document.documentElement;

let stored = null;
try { stored = localStorage.getItem(THEME_KEY); } catch {}
const chosen = document.getElementById(
  stored === "light" ? "t-light" : stored === "dark" ? "t-dark" : "t-sys",
);
if (chosen) chosen.checked = true;

for (const input of document.querySelectorAll(".theme input")) {
  input.addEventListener("change", () => {
    const v = input.value;
    root.style.colorScheme = v === "system" ? "" : v;
    try { v === "system" ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, v); } catch {}
  });
}

/* The clipboard can be unavailable or denied, so the failure path tells the user
   what to do instead of failing silently. */
for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    const done = (label) => {
      button.textContent = label;
      setTimeout(() => { button.textContent = "Copy"; }, 1600);
    };
    try {
      await navigator.clipboard.writeText(source.textContent.trim());
      done("Copied");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(source);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      done("Press Ctrl+C");
    }
  });
}
