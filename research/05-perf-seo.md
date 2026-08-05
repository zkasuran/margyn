# Margyn: fonts, performance, head block, assets

Written 2026-08-05. Decisions for one hand-written HTML file with inlined CSS
plus one same-origin ES module, both bundled into a Cloudflare Worker script as
JavaScript strings. Every byte of page weight is also worker script weight.

Sizes below were measured today, not estimated. The commands are in the sources
section so a later editor can re-run them instead of trusting this file.

---

## 1. Font strategy

### The two stacks, exact strings

UI text (body, headings, buttons):

```css
font-family: "Segoe UI Variable Text", ui-sans-serif, system-ui, -apple-system,
  "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

Monospace (paths, commands, diffs, reproduction blocks):

```css
font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, "Cascadia Mono",
  Consolas, "Liberation Mono", "Roboto Mono", monospace;
```

Recommendation, committed: option (a), the system stack. No webfont, no font
request, no base64, no preconnect. The hero heading is the LCP element on this
page, so the fastest premium hero is one that paints on the first frame.

### Why the UI stack is ordered that way

`"Segoe UI Variable Text"` comes first on purpose. Windows 11 ships the Segoe UI
Variable family, but the OS still reports plain Segoe UI as the system font, so
`system-ui` on Windows 11 resolves to the older static face. Naming the variable
subfamily first is the only way to get the newer optically sized face. macOS,
iOS, Android and Linux do not have it installed, so they fall straight through to
the next entry. Nothing is lost by putting it first.

`ui-sans-serif` then `system-ui` then `-apple-system` is belt and braces in
descending age. `ui-sans-serif` is the CSS Fonts 4 generic that maps to the
platform UI font. `system-ui` is the widely supported keyword: San Francisco on
Apple, Segoe UI on Windows, Roboto on Android. `-apple-system` is the old Safari
prefix and is redundant in 2026, but it is 14 bytes and it costs nothing.

The stack ends in `sans-serif` and the mono stack ends in `monospace`. That is
not decoration. Fallback is resolved inside the declaration that names the font,
not by walking back up to the parent, so any element that overrides
`font-family` and forgets the generic drops to the browser default, which is
usually Times. Every `font-family` declaration on this page carries its own
generic terminator.

### Do not chase a locally installed Inter

Putting `Inter` at the front of the stack is a popular trick and it is wrong
here. It makes the page render in one of three unrelated typefaces depending on
what the visitor happens to have installed, so the design can never be checked.
Worse, developers are exactly the audience most likely to have Inter installed
locally, often an old 3.x static copy with different metrics from current Inter
4.x, so the one segment we care about gets the least predictable result. If we
want Inter we ship Inter. We do not hope for it.

### Option (b), self-hosted subset inlined as base64

Measured today, not estimated. Google Fonts v20 Inter, latin subset only
(`U+0000-00FF` plus punctuation and symbol ranges), variable across weight 400
to 700:

| Artifact | raw woff2 | base64 | base64 then gzip -9 |
| --- | --- | --- | --- |
| Inter latin, variable 400 to 700 | 48,256 B | 64,344 B | 48,665 B |
| Inter latin, static 400 only | 23,664 B | 31,552 B | 23,837 B |
| JetBrains Mono latin, variable | 31,432 B | 41,912 B | 31,726 B |
| Inter subset to printable ASCII plus 8 marks | 16,576 B | 22,104 B | 16,733 B |
| JetBrains Mono, same subset | 8,672 B | 11,564 B | 8,759 B |

So a Latin subset costs roughly 24 KB base64 for one static UI weight, 63 KB
base64 for a variable UI face and about 22 KB base64 if you subset hard to the
characters this page actually prints. Base64 inflates by 33.3 percent, which is
arithmetic, not a benchmark.

Two things make that worse than the table looks.

The compression does not save you. woff2 is already Brotli compressed inside, so
gzipping the base64 only undoes the base64 inflation and returns you to about the
raw size. Inter latin base64 gzips to 48,665 B against a 48,256 B raw file. The
worker script limit and the response both pay near enough the full font size.

Inlining moves the font into the render-blocking path. The CSS is inline in the
`<head>`, so the font bytes arrive before the first paint rather than in parallel
with it. A 48 KB inline font turns a 1.1 KB Brotli HTML response into a 49 KB one
and the hero cannot paint until all of it is parsed. That is the opposite of what
LCP wants. Base64 encoding assets is an anti-pattern for exactly this reason:
you trade a parallel request for a serial one.

Context for the byte budget: the whole page today is 3,270 B of HTML (1,098 B
Brotli) and 5,010 B of module (1,748 B Brotli). One inlined variable font would
be roughly fifteen times the entire current page. The worker limit is 3 MiB
compressed on the free plan, so the limit is not the constraint. The first paint
is.

### Option (c), preconnect to a font CDN

A `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` saves
the DNS, TCP and TLS legs, roughly 100 to 300 ms on mobile. It does not save the
request itself. The real cost is the shape: HTML, then the font CSS on a third
origin, then the font file. That is a three-hop dependent chain and the font CSS
is render-blocking unless it is loaded async, in which case you get a swap
instead. It also puts a third party in the critical path of the first paint of a
page whose entire pitch is that it does not trust things that look fine.

Self-hosting the woff2 as a second worker route would beat the CDN (same origin,
no extra connection, no cross-origin cache partitioning, which killed the shared
Google Fonts cache years ago) but it still adds a request and still needs
`font-display` and metric overrides to avoid shift.

### The decision

System stack. Reasons, in order of weight:

1. **Zero cost on every axis.** No request, no bytes, no worker script growth, no
   third party, no `font-display` decision, no metric override, no CLS from a
   swap, no flash of fallback text. The font is already resolved when the HTML
   arrives.
2. **The hero text is the LCP element.** A text LCP with a system font paints on
   the first frame. Any webfont path either delays that paint (`block`) or
   repaints it (`swap`) and a swap that changes metrics is a CLS event on the
   largest element on the page.
3. **Premium feel is achievable without a webfont.** On the machines that matter
   here, the system font is San Francisco or Segoe UI Variable, both of which are
   excellent. Premium comes from the typographic decisions, not the file:
   `letter-spacing: -0.02em` on large headings, `font-variant-numeric:
   tabular-nums` on any counts, a 1.55 to 1.65 body line height, a measure capped
   near 68 characters, `text-wrap: balance` on headings, `font-optical-sizing:
   auto` and restraint about weights.
4. **It matches the product's own claim.** A tool that says "every finding ships
   a reproduction" should not ship a landing page whose first paint depends on a
   CDN nobody audited.

The one real cost is that the page looks slightly different per platform. For a
developer tool that is acceptable and it is invisible to any single visitor.

If a future decision overrides this and a webfont is required, the order of
preference is: self-host one static woff2 subset on the same origin as a second
worker route, `font-display: optional`, preload it and set `size-adjust`,
`ascent-override` and `descent-override` on a `@font-face` fallback so the swap
cannot shift layout. Inline base64 stays last.

---

## 2. Performance

### The 2026 thresholds

Unchanged for 2026. All three are judged at the 75th percentile of real Chrome
users, segmented by mobile and desktop, over a 28 day window. A page passes only
if all three are in the good band.

| Metric | Good | Needs improvement | Poor |
| --- | --- | --- | --- |
| LCP | 2.5 s or less | 2.5 s to 4.0 s | over 4.0 s |
| INP | 200 ms or less | 200 ms to 500 ms | over 500 ms |
| CLS | 0.1 or less | 0.1 to 0.25 | over 0.25 |

Diagnostics with no ranking weight but worth targeting on this page: TTFB under
800 ms, FCP under 1.8 s, TBT under 200 ms in Lighthouse.

Realistic target for this page, given it is 1.1 KB of Brotli HTML from a
Cloudflare edge: LCP under 800 ms on a warm cache and under 1.2 s on a cold 4G
load, CLS exactly 0, INP under 50 ms. Anything worse than that means something on
this list was skipped.

### CLS from the sticky header

`position: sticky` does not itself cause CLS. The element stays in flow, so no
shift happens when it sticks. Four things around it do.

1. **A header that changes height on scroll.** A shrinking sticky header or one
   that gains a border or a shadow that changes its box height, shifts everything
   below it. Fix: animate only `transform`, `opacity`, `background-color`,
   `box-shadow` and `backdrop-filter`. Never `height`, `padding` or `font-size`.
   A shadow that appears on scroll comes from `box-shadow`, which does not affect
   layout. It must not come from `border-bottom`, which does.
2. **Switching from static to fixed after load.** If any script adds a class that
   makes the header `position: fixed`, the header leaves flow and the page jumps
   by the header height. Fix: declare `position: sticky; top: 0` in the initial
   CSS and never change the position property.
3. **Scrollbar gutter.** Content that grows past one viewport adds a scrollbar and
   narrows the layout, which reflows the centred column. Fix:
   `html { scrollbar-gutter: stable; }`.
4. **Anchor targets hidden under the header.** Not CLS, but the same bug family.
   Fix: `scroll-padding-top` on the root equal to the header height, plus
   `scroll-margin-top` on section headings.

Give the header a fixed height in a custom property so the value is stated once:
`--hdr: 56px`, then `height: var(--hdr)` on the header and `scroll-padding-top:
calc(var(--hdr) + 12px)` on `html`.

### LCP on hero text

The LCP element here is the `<h1>` or the tagline paragraph, whichever renders
the larger text block. Text LCP is the easiest kind to win because there is no
image to fetch. The rules:

1. **Nothing render-blocking above it.** One inline `<style>` block in the head,
   no external stylesheet, no synchronous script. The current page already does
   this. Keep it.
2. **The hero text must be in the initial HTML.** Never rendered by JavaScript,
   never revealed by a class the module adds. If the module has to run before the
   headline exists, LCP becomes module-load time plus render time on a third party
   CDN.
3. **No entrance animation on the hero.** An element at `opacity: 0` is not
   painted, so LCP is recorded at the end of the fade, not the start. If an
   entrance effect is wanted, animate a decoration next to the text.
4. **System font.** See section 1. A webfont with `font-display: block` delays the
   text paint by up to 3 s of block period.
5. **TTFB is the floor.** Worker responses come from the edge, so TTFB is tens of
   milliseconds. Set `Cache-Control: public, max-age=0, must-revalidate` on the
   HTML so a deploy is visible immediately and `public, max-age=31536000,
   immutable` on `/app.mjs` only if the module ever gets a hashed name.
6. **Compress it.** Cloudflare Brotli-compresses worker responses when the client
   sends `Accept-Encoding: br`. 3,270 B of HTML becomes 1,098 B. Verify with
   `curl -sI -H 'accept-encoding: br'` after deploy rather than assuming.

### Layout shift when the session state resolves

This is the one real CLS risk on the page and the current markup has it. Today
the bar renders `checking session…` with four `hidden` buttons, then the module
unhides some of them. Unhiding a button changes the width of a flex row and can
change its height when it wraps. That is a shift on a visible element and it
lands after paint, so it counts.

The fix is to make the resolved and unresolved states occupy the same box.

1. **Reserve the row.** Fixed height on the bar: `min-height: 44px` for a single
   row of 40 px controls plus padding. The height then cannot change no matter
   which buttons appear.
2. **Reserve the widest arrangement, not the current one.** The states differ
   (`Sign in` alone, versus `Get my licence` plus `Sign out`). Put the auth
   controls in a fixed slot on the right: `.auth { display: flex; gap: 8px;
   justify-content: flex-end; min-width: 15ch }`, sized to the widest combination
   and measured once in the browser.
3. **Swap with visibility, not layout.** Where the states have different widths,
   render both and toggle `visibility: hidden` plus `pointer-events: none` instead
   of the `hidden` attribute. `visibility` does not affect layout, so nothing
   moves. Where the widths match, `hidden` is fine and simpler.
4. **Make the placeholder the same shape as the answer.** `checking session…` is
   17 characters and `you@example.com · scanning unlocked` is 35, so the text node
   changes width on its own. Give `#who` `min-width: 24ch; white-space: nowrap;
   overflow: hidden; text-overflow: ellipsis`.
5. **Do not shift the hero.** Never insert a banner (trial notice, signed-in
   confirmation, error) above the hero after load. Post-load messages go into the
   reserved bar or below it. A node inserted at the top of the document moves
   every element on the page, which is the worst CLS pattern there is.
6. **Buttons are the same size in both states.** Same padding, same font, same
   border width for primary and ghost. A ghost button that drops its border is
   2 px narrower than the primary and will nudge the row.

Target: CLS 0.000. Achievable on a page with no above-the-fold images and no
webfont. Anything above 0 here is a bug with a named cause.

### Render-blocking

What blocks the first paint on this page and what does not:

| Resource | Blocks render | Blocks LCP |
| --- | --- | --- |
| inline `<style>` in head | yes, by design | no, it arrives with the HTML |
| `<script type="module" src="/app.mjs">` | no, modules are deferred | no, unless it writes the hero |
| the esm.sh import inside `app.mjs` | no | no |
| an external stylesheet | yes | yes |
| a classic `<script>` in head with no defer | yes | yes |

Module scripts are deferred by default, so the existing `<script
type="module" src="/app.mjs">` does not block parsing or painting. Keep it at the
end of `<body>` anyway: it costs nothing and it survives a future edit that drops
the `type` attribute.

Rules: exactly one inline `<style>`, no `@import` anywhere (an `@import` inside
inline CSS creates a render-blocking request the preload scanner cannot see), no
classic scripts, no analytics snippet in the head. If analytics is ever added it
goes after the module and it is `async`.

### The Tiun SDK from esm.sh

Measured today against the live CDN.

`https://esm.sh/@tiun/sdk@0.9.1` returns a 139 byte shim that re-exports from
`/@tiun/sdk@0.9.1/es2022/sdk.mjs`, which is 8,271 B raw and 2,945 B gzipped. Both
respond `cache-control: public, max-age=31536000, immutable` with
`access-control-allow-origin: *`, served from Cloudflare, `cf-cache-status: HIT`.
Warm timings from here: 128 to 150 ms for the shim, 435 ms total for the real
module on a first hit including 41 ms connect and 96 ms TLS.

That shim matters. The dependency chain to a resolved session is four deep:

```
HTML  ->  /app.mjs (same origin)  ->  esm.sh shim (139 B)  ->  esm.sh sdk.mjs (8 KB)
```

Two of those hops are on a third-party origin and the second cannot start until
the first has been fetched and parsed. On a cold mobile connection that is
plausibly 600 ms to 1.2 s before `tiun.init` is even called.

**Does it block?** Not the paint and not LCP. It blocks the session state, the
Sign in button, the buy button and the enabling of the Scan button. So it does not
hurt the Core Web Vitals directly. It decides how long the page is inert.

**Fix the chain, not the hop.** Two lines in the head, in this order:

```html
<link rel="preconnect" href="https://esm.sh" crossorigin>
<link rel="modulepreload" href="https://esm.sh/@tiun/sdk@0.9.1/es2022/sdk.mjs" crossorigin>
```

`preconnect` warms DNS, TCP and TLS to esm.sh, worth roughly the 41 ms connect
plus 96 ms TLS measured above, more on mobile. `modulepreload` fetches and parses
the module in parallel with the HTML instead of waiting for the shim to be parsed
first, which removes one full round trip from the chain. It always fetches in
`cors` mode, so `crossorigin` is required. Pinning the deep path is safe because
esm.sh serves it `immutable` and the version is pinned in the import anyway. If
the deep path is thought too fragile, preconnect alone still helps and cannot
break.

**What happens if esm.sh is slow or down.** Today, the whole interactive layer
dies silently. `import { tiun } from "https://esm.sh/@tiun/sdk@0.9.1"` is a static
import at the top of `app.mjs`, so a failed fetch means the module never
evaluates. No `paint()` runs. The bar stays on `checking session…` forever, the
Scan button stays disabled and nothing tells the visitor why. The page looks
broken in the exact way the product exists to catch.

Three mitigations, in order of value:

1. **Time out the placeholder.** Put a 6 s timer in the inline HTML, not in the
   module, so it runs even when the module never loads. On fire, replace
   `checking session…` with a real sentence and a link: sign-in is unavailable,
   the CLI still works, here is the npx command. `npx margyn` is the free path and
   it needs no session, so a dead CDN should degrade to the free product, not to a
   spinner. Wire the module to cancel the timer as its first act.

   ```html
   <script>
     window.__tiunTimer = setTimeout(() => {
       const w = document.getElementById("who");
       if (w && w.dataset.pending === "1") {
         w.textContent = "sign-in unavailable, the CLI still works";
       }
     }, 6000);
   </script>
   ```

   That is a classic inline script, so keep it a few lines and place it after the
   element it touches.
2. **Wrap the import so a failure is catchable.** Change the static import to a
   dynamic one inside a `try`. A dynamic `import()` rejects on a network error,
   which a static import at module top level cannot usefully report.

   ```js
   let tiun;
   try {
     ({ tiun } = await import("https://esm.sh/@tiun/sdk@0.9.1"));
   } catch {
     degrade("sign-in unavailable, the CLI still works");
     throw new Error("sdk unreachable");
   }
   ```
3. **Vendor the SDK.** The published package has no dependencies, is MIT licensed
   and ships `tiun.js` as the ESM entry at 14,807 B raw, 3,835 B Brotli. Measured
   from the npm tarball today. Bundling it into the worker alongside the other two
   files is about 3.8 KB of compressed script and it removes the third-party
   origin from the critical path entirely: no preconnect, no CORS, no SRI question,
   no CDN outage.

   The tradeoff is that a vendored copy has to be re-vendored when Tiun ships a
   fix. `esm.sh` also cannot be integrity-checked from a static `import` statement:
   SRI applies to `<script>` and `<link>` elements, so the only way to pin a hash
   for an imported module is an import map with an `integrity` key, which is recent
   and not universally supported. Vendoring sidesteps that. For the hackathon,
   keep esm.sh with mitigations 1 and 2 in place, since the import URL is part of
   the integration story we are being judged on. Note vendoring as the production
   answer.
   For reference, the current module hashes to
   `sha384-O5TaI86Qm/lDcpc2W9Iv47SLamurRWLRWLyOTIoVYxtNTmyETuaO325ALdQgqATS`.

**INP.** The buttons call into the SDK, which does network work. Every handler
must disable its own button on the first click and re-enable it in a `finally`,
otherwise a slow Tiun call gets clicked three times. The existing `licence`
handler already does this. Do the same for `login`, `buy` and `scan`. INP measures
the delay to the next paint, so paint the disabled state before awaiting.

### The five rules, ranked

1. One inline `<style>`, no external CSS, no `@import`, no classic script in the
   head. Nothing may block the hero paint.
2. Reserve the session bar's box before the session resolves: fixed
   `min-height`, `min-width` in `ch` on the identity text and `visibility`
   swaps instead of layout swaps. Target CLS 0.000.
3. System font stack. No webfont, no base64, no font CDN. The hero is a text LCP
   and it should paint on the first frame.
4. `preconnect` plus `modulepreload` to esm.sh and make the page degrade to the
   free CLI path in the head when the SDK never arrives.
5. The sticky header has a fixed height and animates only `transform`, `opacity`
   and `box-shadow`. Pair it with `scrollbar-gutter: stable`.

---

## 3. The complete head block

Paste-ready. Values are real: the domain, the tagline from `package.json`, the
repo URL, the MIT licence, the 8.99 USD a month Watch subscription (verified in
the Tiun product record today, `priceInCents: 899`, `intervalType: Month`, no
trial).

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Margyn: prove your test suite actually checks something</title>
<meta name="description" content="Margyn audits the machinery meant to catch your bugs and reports only what it can prove. Every finding ships a reproduction you can run. Free CLI, no signup.">
<link rel="canonical" href="https://margyn.xyz/">

<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FBFAF8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0F12" media="(prefers-color-scheme: dark)">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Margyn">
<meta property="og:url" content="https://margyn.xyz/">
<meta property="og:title" content="Margyn: prove your test suite actually checks something">
<meta property="og:description" content="Audits the machinery meant to catch your bugs. Every finding ships a reproduction you can run. Free CLI, no signup.">
<meta property="og:image" content="https://margyn.xyz/og.png">
<meta property="og:image:secure_url" content="https://margyn.xyz/og.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Margyn. A test that asserts nothing, next to the reproduction command that proves it.">
<meta property="og:locale" content="en_GB">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Margyn: prove your test suite actually checks something">
<meta name="twitter:description" content="Audits the machinery meant to catch your bugs. Every finding ships a reproduction you can run. Free CLI, no signup.">
<meta name="twitter:image" content="https://margyn.xyz/og.png">
<meta name="twitter:image:alt" content="Margyn. A test that asserts nothing, next to the reproduction command that proves it.">

<link rel="preconnect" href="https://esm.sh" crossorigin>
<link rel="modulepreload" href="https://esm.sh/@tiun/sdk@0.9.1/es2022/sdk.mjs" crossorigin>
```

Continues in the next block.

The JSON-LD, same head, after the link hints:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://margyn.xyz/#app",
  "name": "Margyn",
  "url": "https://margyn.xyz/",
  "description": "A test-suite auditor. Margyn audits the machinery meant to catch your bugs and reports only what it can prove. Every finding ships a reproduction you can run.",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "Software testing",
  "operatingSystem": "Linux, macOS, Windows",
  "softwareVersion": "0.0.1",
  "softwareRequirements": "Node.js 22 or newer, git",
  "runtimePlatform": "Node.js",
  "isAccessibleForFree": true,
  "license": "https://opensource.org/license/mit",
  "codeRepository": "https://github.com/zkasuran/margyn",
  "installUrl": "https://github.com/zkasuran/margyn#install",
  "image": "https://margyn.xyz/og.png",
  "featureList": [
    "ignored-source: files the repository reads that git never committed",
    "unrun-check: gates declared and never invoked",
    "lint-blindspot: linters excluded by the ignore file rather than their own config",
    "no-assertion: tests that assert nothing",
    "mutation proof: inverts a line, reruns the suite, reports the suite that stayed green"
  ],
  "author": { "@type": "Person", "name": "zkasuran", "url": "https://github.com/zkasuran" },
  "offers": [
    {
      "@type": "Offer",
      "name": "Margyn CLI",
      "description": "The local scanner and its four static checks. Free, no account.",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://margyn.xyz/"
    },
    {
      "@type": "Offer",
      "name": "Watch",
      "description": "Adds the mutation proof, which runs the real test suite once per mutation.",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://margyn.xyz/",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "8.99",
        "priceCurrency": "USD",
        "billingIncrement": 1,
        "unitCode": "MON",
        "referenceQuantity": {
          "@type": "QuantitativeValue",
          "value": 1,
          "unitCode": "MON"
        }
      }
    }
  ]
}
</script>
</head>
```

### Why each part is there and what is deliberately absent

**No `aggregateRating`, no `review`, no `ratingValue`, no download count, no
`interactionStatistic`.** Google's SoftwareApplication guidance lists three
required properties: `name`, `offers.price` and at least one of
`aggregateRating` or `review`. Margyn is pre-launch with no customers, so the
third one cannot be supplied honestly. The consequence is that the app rich
result will not render. That is the correct trade. A fabricated rating in JSON-LD
is a machine-readable lie, it is exactly what Google's structured data policies
call out as spam and it invites a manual action that costs the whole page its
rich result eligibility. The markup still earns its place: it is unambiguous
entity data for search and for LLM crawlers, both of which read it whether or not
a star rating appears.

Google also spent 2025 and 2026 retiring rich result types it judged
low-value. Building the page's SEO on a star rating we do not have would be
betting on a feature that is being pruned anyway. Recheck the live Search Central
page before launch rather than trusting this note.

**Two offers, not one.** The free CLI and Watch are different transactions, so
they are two `Offer` nodes. `price: "0"` on the CLI offer satisfies Google's
required `offers.price` and is true: the four static checks need no account.
`isAccessibleForFree: true` is the schema.org property for the same fact and
supersedes the older `free`.

**Watch is priced with `priceSpecification`, not a bare `price`.** A bare `price`
on an `Offer` reads as a one-off charge. `UnitPriceSpecification` with
`referenceQuantity` of 1 `MON` (the UN/CEFACT code for month) and
`billingIncrement: 1` says 8.99 USD per month, which is what the product record
says. Stating a subscription as `"price": "8.99"` with no interval would be
technically parseable and practically misleading.

**`softwareVersion: "0.0.1"`** matches `package.json` today. It has to be bumped
with the package or dropped. A stale version in structured data is a small lie
that is easy to check.

**No `downloadUrl`.** `margyn` is not on the npm registry yet: a fetch of
`https://registry.npmjs.org/margyn` returns 404 today. Do not assert a download
URL that 404s. Add `"downloadUrl": "https://www.npmjs.com/package/margyn"` the
day it is published, not before.

**`installUrl` and `codeRepository` point at the GitHub repo, which is currently
private.** An anonymous fetch of `https://github.com/zkasuran/margyn` returns 404
today. Both URLs, plus the ones in the OG tags, must be re-verified anonymously
after the repo is flipped public. A JSON-LD `codeRepository` that 404s for a judge
is the same broken-link failure as a private repo in a submission.

**`og:locale` is `en_GB`.** The copy uses British spelling (`licence`), so declare
it.

**`meta name="color-scheme"` is separate from `theme-color`.** `color-scheme`
tells the browser to render form controls, scrollbars and the default canvas in
the matching scheme, which prevents a white flash before the CSS applies.
`theme-color` only tints browser chrome, supports the `media` attribute for
`prefers-color-scheme` and is honoured by Chrome on Android and Safari 15 and
later. Desktop Firefox ignores it. Both are worth the four lines.

**Title is 55 characters, description is 157.** Measured, not estimated. Both sit
inside the usual truncation points for Google (roughly 580 px of title, 155 to 160
characters of description on mobile). The title leads with the product name then
the benefit, because the brand is unknown and the query will be a problem, not a
name. `og:description` is 115 characters and the image alt is 85, both shorter on
purpose: social cards truncate harder than search results.

---

## 4. Assets needed

Five files. All generated with PIL or written by hand as SVG. No stock photos, no
downloaded images, no screenshots of a UI that does not exist.

### One blocker to fix first

`bin/bundle-static.mjs` reads every file in `web/public/` with
`readFileSync(path, "utf8")` and embeds it with `JSON.stringify`. That is correct
for HTML, JS and SVG and it corrupts any binary file. A PNG bundled that way is
mangled by the utf8 decode and served as garbage.

So before adding `og.png`, `favicon.ico` or `apple-touch-icon.png`, the bundler
needs a binary branch: read binary extensions as a Buffer, emit
`{ type, b64: "..." }`, then in the worker decode with
`Uint8Array.from(atob(asset.b64), (c) => c.charCodeAt(0))` and return that as the
body. The MIME map also needs `.png` and `.webp`. Note the size cost: base64 adds
33 percent to the worker script, so keep the PNGs to the numbers below and confirm
the bundler's own 2.5 MB warning still passes.

### The files

**`favicon.svg`, 32x32 viewBox, hand-written SVG, under 600 bytes**

Why: the primary favicon for every modern browser and it scales to every size
including the 16 px tab. One file replaces the whole legacy icon set.

Spec: `viewBox="0 0 32 32"`, no `width` or `height` attributes so it scales, no
external references, no embedded font. Text in an SVG favicon renders with
whatever the OS happens to have, so the mark must be geometry only. Ship both
schemes in the one file, because the mark on a near-black tab bar needs the light
accent:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .bg { fill: #FBFAF8 } .fg { fill: #0F5C4E }
    @media (prefers-color-scheme: dark) { .bg { fill: #0E0F12 } .fg { fill: #57C9AE } }
  </style>
  <rect class="bg" width="32" height="32" rx="7"/>
  <!-- mark goes here, see the logo note below -->
</svg>
```

**`favicon.ico`, 32x32 and 16x16 in one file, under 6 KB**

Why: the fallback for anything that ignores SVG icons and the file some crawlers
and feed readers request at `/favicon.ico` whatever the markup says. Generate with
PIL: draw at 128x128, downsample with `Image.LANCZOS`, then
`im.save("favicon.ico", sizes=[(16, 16), (32, 32)])`. Light-mode colours only,
since ICO has no scheme switching.

**`apple-touch-icon.png`, 180x180, PNG, under 8 KB**

Why: iOS home screen and Safari bookmarks. iOS ignores SVG favicons and it
composites onto its own rounded rectangle, so this file needs a full-bleed
background, no transparency and no rounded corners of its own. Light palette. Keep
the mark inside a 152 px safe area so the iOS mask cannot clip it.

**`og.png`, exactly 1200x630, PNG, target under 15 KB**

Why: the link preview on X, Slack, Discord, LinkedIn and anywhere else the URL
gets pasted. Most people will see this before they see the page.

Spec: 1200x630 is 1.905:1, which is the 1.91:1 Facebook asks for to avoid cropping
in feed and it satisfies X's `summary_large_image` layout. The published limits:
Facebook recommends at least 1200x630 for high-resolution devices, calls 600x315
the practical floor for the large layout, sets the absolute minimum at 200x200 and
caps the file at 8 MB. Declaring `og:image:width` and `og:image:height` lets the
crawler render the preview on the first share instead of waiting on an async
download.

Encoding, measured with PIL today on a real draft of the card below: truecolour
PNG 35.6 KB, quantised to an adaptive 8-colour palette 9.0 KB, 16 colours 11.1 KB,
JPEG at q90 49.9 KB. So flat colours, `convert("P", palette=Image.ADAPTIVE,
colors=16)`, save PNG with `optimize=True`. Never JPEG here: text on flat colour is
the exact case where PNG wins and JPEG rings around every glyph. 11 KB raw is about
15 KB base64 inside the worker, which is affordable.

### What the OG image should actually contain

The brand is precision and evidence, so the card should be a piece of evidence,
not a slogan over a gradient. The strongest thing Margyn owns is a finding with its
reproduction attached. Put that on the card.

Layout, drawn and checked at 1200x630 today:

- A 8 px teal rule across the very top. `#0F5C4E` on `#FBFAF8`. That is the whole
  brand signal and it survives being cropped to a square thumbnail.
- Wordmark `Margyn` at roughly 64 px bold, ink `#17181C`, left margin 80 px, top
  around 90 px.
- One line of claim under it at about 28 px in `#5A5C66`: "Proves your checks do
  not check anything."
- The evidence panel, `#F5F3EF` on the off-white with a `#E4E1DB` hairline,
  filling the lower two thirds. Inside it, monospace at about 26 px, real Margyn
  output shape: the command, one finding with its severity and file and line, the
  one-line reason, then the reproduction command with a comment saying the test
  passes either way. The severity word in `#A33A16`.
- Nothing else. No logo grid, no arrows, no faces, no fake browser chrome, no
  screenshot of a UI.

Two content rules. First, the output on the card has to be output the tool really
produces, from a real run against a real repo, viewport-cropped rather than
retyped. Copy a genuine finding from a `node src/cli.mjs --json` run and lay it
out. Second, do not print a fake path. Use one that exists in this repo or an
obviously generic `test/parse.test.mjs` and never a real third-party project's
file, since a card that names someone else's repo as failing is a claim about them.

Safe area: keep every glyph at least 60 px from all edges. Slack and X crop the
card differently and X will centre-crop toward 2:1 on some surfaces.

Legibility gate: after generating, shrink the card to 300 px wide and look at it.
If the wordmark and the claim line do not read at that size, the type is too small.
The panel text is allowed to become texture at thumbnail size, since it reads as
"this is a terminal" and that is its job there.

A dark variant is tempting and is not worth it. There is no scheme negotiation in
the OG protocol, every platform gets one image and the light card reads on both
Slack themes. Ship one.

Fonts for the render: PIL needs a real TTF path, so pick one already on the
machine with a licence we can point at. `DejaVuSans-Bold.ttf` and
`DejaVuSansMono.ttf` are present under `/usr/share/fonts/truetype/dejavu/` and the
DejaVu licence is permissive. Record which file was used in a comment in the
generator, so the card can be regenerated identically and its licence defended.
The card's font has nothing to do with the page's font: section 1 governs the page.

### The logo mark, inline SVG

Icon fonts are out. Every mark on the page is inline SVG in the HTML, not a
separate request and not a font.

- **Inline, not `<img>`.** An inline `<svg>` costs no request and inherits colour
  through `fill="currentColor"`, which means the mark follows the theme with no
  duplicate dark-mode asset. An `<img src="logo.svg">` cannot inherit colour and
  adds a round trip.
- **Reuse with `<symbol>` and `<use>`.** If a mark appears more than twice, define
  it once in a `<svg style="display:none">` block containing `<symbol
  id="m-check" viewBox="0 0 24 24">`, then reference it with `<svg class="i"><use
  href="#m-check"/></svg>`. The definition block goes at the start of `<body>`, not
  the head, because a hidden `<svg>` in the head is invalid.
- **Set a size in CSS, never leave it intrinsic.** `.i { width: 1em; height: 1em;
  flex: none }`. An SVG with no dimensions and no aspect ratio hint can render at
  300x150 for one frame, which is a CLS event. `flex: none` stops a flex parent
  shrinking it.
- **Geometry only.** No `<text>`, no embedded font, no filters. Strokes get
  `stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"` and
  `vector-effect="non-scaling-stroke"` if the mark is ever scaled non-uniformly.
- **Accessibility.** A decorative mark gets `aria-hidden="true"`. A mark that is
  the only content of a control gets `role="img"` plus a `<title>` child and the
  control gets an `aria-label`.
- **What the mark should be.** Precision and evidence, at 16 px, in one or two
  paths. Candidates worth drawing: a check mark with a gap or a break in it (the
  check that does not check, which is the product in one glyph) or a caliper or
  margin rule, which reads "margin" and "measure" and matches the name. Draw both
  at 16 px and pick by eye. A magnifying glass is generic and every scanner uses
  one.
- **The broken check needs a tested gap.** Drawn today at 32x32 and rasterised to
  16 px: two strokes at `stroke-width="3.2"` with a 4.4 unit gap still read as a
  check with a nick in it, which is the intent. Widen the gap to about 7.5 units
  and it stops being a check at 16 px and becomes two unrelated diagonal dashes.
  So draw the gap small, then look at it at 16 px before committing. The whole SVG
  is around 430 bytes either way, so the cost of getting this right is one render.


---

## 5. Before this ships

Things here that depend on facts which can change. Check each rather than trusting
the file.

- **`downloadUrl` stays out of the JSON-LD** until `margyn` is on npm.
  `https://registry.npmjs.org/margyn` returned 404 today.
- **The repo is private.** `https://github.com/zkasuran/margyn` returned 404
  anonymously today. `codeRepository`, `installUrl` and every URL in the OG tags
  must be re-fetched anonymously after the flip to public. Authenticated `gh` calls
  prove nothing here.
- **`softwareVersion`** must match `package.json`, which reads `0.0.1` today.
- **The 8.99 USD price** came from the live Tiun product record today
  (`p-test-522721e`, `priceInCents: 899`, `intervalType: Month`, USD, no trial).
  That is the sandbox record and the product is currently named `PlaceBo Sub`, not
  `Watch`. Re-read it before the number is printed and decide whether the product
  gets renamed or `Watch` is a display name we own.
- **The bundler cannot carry binary files yet.** See section 4.
- **Verify Brotli after deploy.** `curl -sI -H 'accept-encoding: br'
  https://margyn.xyz/` returned `content-encoding: br`, 1,328 bytes, TTFB 229 ms
  today. Re-check after any header change.
- **The live HTML sends `cache-control: public, max-age=60`**, which is fine and
  better than `no-store`. Leave it unless deploys need to be visible faster.
- **Run the Rich Results Test** on the JSON-LD before launch and read what it says
  about the missing rating. Expect the app result to be reported ineligible. That is
  the intended state, not a bug to fix by inventing data.

---

## Sources

Everything numeric here was measured on this machine today or taken from one of
the pages below. The commands are included so a later editor re-runs them rather
than trusting this file.

**Measured here, 2026-08-05**

```bash
# font subsets
curl -s "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap"   # then fetch the latin woff2
pyftsubset inter-latin-var.woff2 --unicodes="U+0020-007E,U+00A0,U+00B7,U+2018-201D,U+2026,U+2192,U+2713,U+2717" \
  --flavor=woff2 --output-file=inter-min.woff2 --layout-features="" --no-hinting --desubroutinize
# esm.sh chain
curl -sD - -o /dev/null https://esm.sh/@tiun/sdk@0.9.1
curl -s -o /dev/null -w '%{size_download} %{time_appconnect} %{time_starttransfer}\n' \
  https://esm.sh/@tiun/sdk@0.9.1/es2022/sdk.mjs
# vendored SDK size
curl -s https://registry.npmjs.org/@tiun/sdk/-/sdk-0.9.1.tgz | tar xz && wc -c package/tiun.js
# live page
curl -sI -H 'accept-encoding: br' https://margyn.xyz/
# OG card: PIL, quantise to 8, 16, 32 and 64 colours, compare against JPEG q90
```

**Cited**

- Core Web Vitals thresholds and the 75th percentile rule:
  [web.dev/articles/vitals](https://web.dev/articles/vitals),
  [how to pass](https://www.corewebvitals.io/core-web-vitals/how-to-pass),
  [unchanged for 2026](https://eseospace.com/blog/core-web-vitals-in-2026-what-changed-what-still-matters-and-how-to-pass/)
- `system-ui` and the `ui-` generics:
  [browser support summary](https://www.lambdatest.com/web-technologies/font-family-system-ui-firefox),
  [ui-sans-serif resolves to San Francisco on Apple](https://stackoverflow.com/questions/59578361/using-apple-system-for-monospace-and-serif),
  [what the ui- generics are for](https://blog.jim-nielsen.com/2020/system-fonts-on-the-web/)
- `system-ui` does not resolve to Segoe UI Variable on Windows and
  `Segoe UI Variable Text` is the name that does resolve:
  [Chromium issue 486686878](http://issues.chromium.org/issues/486686878),
  [Mozilla bug 1732404](https://bugzilla.mozilla.org/show_bug.cgi?id=1732404),
  [Microsoft on Segoe UI Variable](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/typography),
  [using it on the web](https://tigeroakes.com/posts/segoe-ui-variable/)
- Fallback resolves inside the declaration, not up the tree:
  [CSS Wizardry, April 2026](https://csswizardry.com/2026/04/font-family-doesnt-fall-back-the-way-you-think/)
- Base64 costs 33 percent and is an anti-pattern for large assets:
  [DebugBear](https://www.debugbear.com/blog/base64-data-urls-html-css),
  [CSS Wizardry](https://csswizardry.com/2017/02/base64-encoding-and-performance/)
- `modulepreload` always fetches in `cors` mode, so `crossorigin` is required:
  [MDN](https://developer.mozilla.org/docs/Web/HTML/Attributes/rel/modulepreload),
  [web.dev](https://web.dev/articles/modulepreload)
- SRI does not apply to `import` statements and import maps gained an `integrity`
  key in Firefox 138:
  [MDN SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity),
  [Firefox 138 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/138)
- Worker script limit, 3 MiB compressed on free and 10 MiB on paid, 64 MB before
  compression:
  [Cloudflare community, quoting the deploy error](https://community.cloudflare.com/t/cloudflare-pages-ci-cd-deploy-error-your-worker-exceeded-the-size-limit-of-3-mib/800436/2)
- `theme-color` supports `media` with `prefers-color-scheme` and desktop Firefox
  ignores it:
  [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color)
- SoftwareApplication requires `name`, `offers.price` and one of `aggregateRating`
  or `review`, plus the valid `applicationCategory` list:
  [Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/software-app.md.txt)
- Structured data that misrepresents the page can earn a manual action:
  [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- Google has been retiring rich result types since June 2025:
  [Simplifying the search results page](https://developers.google.com/search/blog/2025/06/simplifying-search-results)
- schema.org definitions for `isAccessibleForFree`, `softwareRequirements`,
  `featureList`, `installUrl` and the rest:
  [schema.org/SoftwareApplication](https://schema.org/SoftwareApplication)
- OG image properties, including `og:image:alt` being recommended whenever
  `og:image` is set: [ogp.me](https://ogp.me/)
- OG image sizing: at least 1200x630, 600x315 for the large layout, 200x200
  absolute minimum, as close to 1.91:1 as possible, 8 MB cap and width plus height
  letting the crawler render on the first share:
  [Facebook sharing docs](https://developers.facebook.com/docs/sharing/webmasters/images/)
- esm.sh is a single third-party origin with its own incident history, including
  CVE-2026-27730:
  [SentinelOne](https://www.sentinelone.com/vulnerability-database/cve-2026-27730/),
  [esm.sh](https://esm-sh.com/)
