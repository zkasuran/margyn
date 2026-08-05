/**
 * The shell every page is poured into.
 *
 * One source of truth for the head, the header and the footer, so six pages
 * cannot drift apart. This is a build-time module, not something the browser
 * loads: bin/build-pages.mjs calls it and writes plain HTML into web/public,
 * which the bundler then carries into the worker. So the site is still static
 * files with inline CSS and no runtime framework.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const CSS = readFileSync(join(here, "style.css"), "utf8");

export const SITE = {
  name: "Margyn",
  origin: "https://margyn.xyz",
  repo: "https://github.com/zkasuran/margyn",
  tagline: "Proves your checks do not check anything.",
};

/** The nav, in one place, so a new page is one entry rather than six edits. */
const NAV = [
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/changelog", label: "Changelog" },
];

const MARK = `<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="var(--accent)"/>
      <path d="M12.5 8.5H9V15M9 19.5v4h3.5M19.5 8.5H23v15h-3.5" stroke="var(--bg)"
            stroke-width="2.6" fill="none" stroke-linecap="square"/>
    </svg>`;

/** Only the home page carries the software schema, so it is not claimed six times. */
const SCHEMA = `{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Margyn",
"applicationCategory":"DeveloperApplication","operatingSystem":"Linux, macOS, Windows",
"url":"https://margyn.xyz/","codeRepository":"https://github.com/zkasuran/margyn",
"description":"Audits the verification layer of a repository. Finds tests that assert nothing, files the repo reads that git never committed, gates no workflow invokes and linter exclusions that live in the ignore file. Every finding ships a runnable reproduction.",
"softwareRequirements":"Node.js 22 or newer, git","license":"https://opensource.org/licenses/MIT",
"offers":[{"@type":"Offer","name":"Free scan","price":"0","priceCurrency":"USD",
"description":"Four static checks, no account and no licence."},
{"@type":"Offer","name":"Watch","price":"8.99","priceCurrency":"USD",
"description":"Adds the mutation proof, with a 3 day free trial.",
"priceSpecification":{"@type":"UnitPriceSpecification","price":"8.99","priceCurrency":"USD",
"billingDuration":1,"billingIncrement":1,"unitCode":"MON"}}]}`;

/**
 * @param page.path the URL path, used for canonical and for marking the nav
 * @param page.title what goes in the tab and the OG card
 * @param page.description the meta description, one sentence
 * @param page.body the page's own markup
 * @param page.schema include the SoftwareApplication block, home page only
 * @param page.session include the sign-in controls, pages that need them only
 */
export function shell(page) {
  const canonical = SITE.origin + (page.path === "/" ? "/" : page.path);
  const nav = NAV.map(
    (n) => `<a href="${n.href}"${n.href === page.path ? ' aria-current="page"' : ""}>${n.label}</a>`,
  ).join("\n    ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:url" content="${canonical}">${page.noindex ? '\n<meta name="robots" content="noindex">' : ""}
<meta property="og:title" content="${page.ogTitle ?? page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:image" content="${SITE.origin}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FBFAF8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0F12" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/favicon.ico" sizes="16x16 32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${page.session ? '<link rel="preconnect" href="https://esm.sh" crossorigin>' : ""}
${page.schema ? `<script type="application/ld+json">\n${SCHEMA}\n</script>` : ""}
<script>
/* Applies a stored theme choice before first paint. A classic inline script on
   purpose: defer, async and type=module all run after paint, so any of them
   would flash the wrong theme at exactly the users who told us their preference. */
(function(){try{var v=localStorage.getItem("margyn-theme");
if(v==="light"||v==="dark")document.documentElement.style.colorScheme=v}catch(e){}})();
</script>
<style>
${CSS}
</style>
</head>
<body>
<a href="#main" class="skip">Skip to content</a>

<header class="bar"><div class="wrap">
  <a class="brand" href="/">${MARK}${SITE.name}</a>

  <nav class="barnav" aria-label="Main">
    ${nav}
  </nav>

  <fieldset class="theme">
    <legend class="sr">Colour theme</legend>
    <input type="radio" name="t" id="t-sys" value="system" checked>
    <label for="t-sys" title="Match the system"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 20h8"/></svg><span class="sr">System</span></label>
    <input type="radio" name="t" id="t-light" value="light">
    <label for="t-light" title="Light"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg><span class="sr">Light</span></label>
    <input type="radio" name="t" id="t-dark" value="dark">
    <label for="t-dark" title="Dark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg><span class="sr">Dark</span></label>
  </fieldset>
${page.session ? `
  <p class="who" id="who" role="status" aria-live="polite"></p>
  <button id="login" class="ghost" hidden>Sign in</button>
  <button id="licence" hidden>Get my licence</button>
  <button id="logout" class="ghost" hidden>Sign out</button>` : `
  <a class="btn sm" href="/pricing">Get Watch</a>`}
</div></header>

<main id="main">${page.session ? `
<div class="wrap"><div class="out" id="out" role="region" aria-label="Your licence"></div></div>` : ""}
${page.body}
</main>

<footer><div class="wrap">
  <div class="foot">
    <div class="footlead">
      <p class="footcmd"><code>npx margyn /path/to/repo</code></p>
      <p>If it finds nothing, you learned that for free. If it finds something, every line
        comes with a command that proves it.</p>
    </div>
    <nav aria-label="Product">
      <p class="foothead">Product</p>
      <a href="/docs">Documentation</a>
      <a href="/pricing">Pricing</a>
      <a href="/changelog">Changelog</a>
      <a href="/security">Security</a>
    </nav>
    <nav aria-label="Elsewhere">
      <p class="foothead">Elsewhere</p>
      <a href="${SITE.repo}">Source on GitHub</a>
      <a href="https://tiun.business">Auth and payments by Tiun</a>
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
    </nav>
  </div>
  <p class="sm footnote">Margyn. MIT licensed. Every number on this site was measured on the
    shipped product, not estimated.</p>
</div></footer>
${page.session ? '<script type="module" src="/app.mjs"></script>' : '<script type="module" src="/theme.mjs"></script>'}
</body>
</html>
`;
}
