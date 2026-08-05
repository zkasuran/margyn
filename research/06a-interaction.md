# 06a. Interaction and motion

Scope: interaction behaviour and motion values only. Accessibility and responsive
layout are covered separately in 06b, so this file names an ARIA attribute only
where the interaction cannot be described without it.

Target shape: one hand-written `index.html` with inline CSS plus one ES module,
both bundled into the Worker script by `bin/bundle-static.mjs`.

## The byte budget, stated honestly

The current bundle is 8,934 bytes for both files (`worker/static.generated.mjs`,
measured 2026-08-05). Cloudflare's script limit is megabytes, so the limit is not
the binding constraint and pretending it is would be theatre. The real constraint
is that the CSS is inline in the head, so every CSS byte sits on the critical
render path and the module blocks nothing but delays session state. So the rule
is not "stay under a cap", it is "no byte that a CSS selector could have done for
free". Every item below is marked **CSS-only** or **needs-JS** on that test.

The one place bytes genuinely bite: the Tiun SDK arrives from `esm.sh` as a
separate network request, uncontrolled by us and it gates sign in, checkout and
the licence mint. Our own module should stay small enough that it is never the
reason the page is slow. Itemised total in section 1.9.

## PART 1. INTERACTION INVENTORY

### 1.1 Theme toggle

Three requirements pull against each other: respect `prefers-color-scheme` with
no JS, let a manual choice override it and never flash the wrong theme. The
usual class-based solution (`<html class="dark">` written by a head script) fails
the first one and duplicates the dark token block.

**Recommended: `color-scheme` is the switch, `light-dark()` reads it.**

`light-dark()` returns its first argument when the used colour scheme is light or
unset, its second when it is dark and it resolves against the element's computed
`color-scheme` ([MDN][ld]). So the OS preference path is pure CSS, with no media
query and no `matchMedia` listener and the manual override is one inline style
on the root element.

Baseline 2024, newly available since May 2024: Chrome 123, Edge 123, Safari 17.5,
Firefox 120 ([MDN][ld]). Roughly two years old as of August 2026.

Two things fall out of it for free, which is why it beats the class approach:

1. A live OS theme change repaints with no `matchMedia` change listener. The
   class approach needs one, plus the listener has to know not to fight a manual
   override.
2. UA widgets follow. Scrollbars, focus rings, text inputs and the select menus
   render in the matching scheme because `color-scheme` is what browsers read for
   that. The class approach has to restyle each one by hand, which is where the
   terminal block's scrollbar (1.7) would otherwise go wrong in dark mode.

#### The CSS strategy (CSS-only)

```css
:root {
  color-scheme: light dark;
  --bg:      light-dark(#FBFAF8, #0E0F12);
  --card:    light-dark(#FFFFFF, #16181C);
  --raised:  light-dark(#F5F3EF, #1D2025);
  --ink:     light-dark(#17181C, #F0F1F3);
  --muted:   light-dark(#5A5C66, #A2A5AE);
  --faint:   light-dark(#686A72, #8A8D96);
  --line:    light-dark(#E4E1DB, #262A30);
  --control: light-dark(#8F8878, #5F6874);
  --accent:  light-dark(#0F5C4E, #57C9AE);
  --high:    light-dark(#A33A16, #FF9366);
  --ok:      light-dark(#1F6B4A, #5FD3A3);
}
```

One token block, not two. The dark palette is not a second `@media` block that
can drift out of sync with the light one, which is the actual maintenance failure
mode on a hand-written file. Measured: 511 bytes as formatted above, 434 with
whitespace collapsed, for all eleven tokens in both modes. A light block plus a
dark media-query block is roughly 900.

Manual override is one declaration on the root element, so it beats the
stylesheet without `!important`:

```
<html style="color-scheme: dark">
```

`color-scheme: light` or `color-scheme: dark` forces that branch and
`light-dark()` follows it ([MDN][ld]).

#### The no-flash problem, stated precisely

With `light-dark()` the OS-preference path cannot flash, because no script is
involved in it. The flash exists only for a stored manual override: someone chose
dark while their OS says light, so the first paint is light and a deferred script
flips it a frame later. That flash is worse than the class-based one because it
happens only to the users who told us what they wanted.

The fix is the standard one, a render-blocking classic script in the head
([codefronts][fouc]). It must be a classic inline script, not `defer`, not
`async`, not `type="module"`, because all three of those run after first paint.

#### The exact head script (needs-JS, 491 bytes measured)

```html
<script>
(function(){var K="margyn-theme",r=document.documentElement,m;
try{m=localStorage.getItem(K)}catch(e){}
if(m)r.style.colorScheme=m;
document.addEventListener("click",function(e){
  if(!e.target.closest("#theme"))return;
  var os=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
  var next=(r.style.colorScheme||os)==="dark"?"light":"dark";
  r.style.colorScheme=next===os?"":next;
  try{next===os?localStorage.removeItem(K):localStorage.setItem(K,next)}catch(e){}
});})();
</script>
```

Four decisions in there worth defending:

**`try/catch` around both storage calls.** `localStorage` throws, not returns
null, when storage is blocked. An uncaught throw in a head script stops parsing
the rest of it, which would take the click handler down with the read.

**The handler is delegated off `document`.** It is registered before the button
exists, so one inline script in the head covers both jobs with no
`DOMContentLoaded` wrapper and no second script tag.

**It is not in the module.** `app.mjs` statically imports the SDK from `esm.sh`.
A static import that fails to resolve kills the whole module, so a theme toggle
living there dies whenever a third-party CDN has a bad day. The theme is ours and
must never depend on their uptime.

**Toggling back to the OS preference clears the override.** `next === os` writes
an empty `color-scheme` and removes the key, so the third state is reachable
without a third control. Someone on a light OS goes light (stored dark cleared),
dark, light and the middle stop of that cycle is "follow the OS" rather than a
permanent pin. A two-state toggle that pins forever is the common bug here: the
user's OS switches to dark at sunset and the site stays light because it is
obeying a choice made in the morning.

#### The toggle button label (CSS-only)

The button's own label must not be written by JS on click or it desynchronises
from the root attribute. Drive it from the root state instead:

```css
#theme::after { content: "Dark" }
@media (prefers-color-scheme: dark) { #theme::after { content: "Light" } }
:root[style*="light"] #theme::after { content: "Dark" }
:root[style*="dark"]  #theme::after { content: "Light" }
```

The last two rules override the media query because the override is on the root
element. The `[style*=]` match works because the head script writes exactly one
declaration to that attribute and nothing else ever touches it. That is a coupling
worth one comment in the HTML, since a later `style` write on `<html>` would break
the label silently while the theme itself stayed correct.

Note for 06b: the visible word is the accessible name here, so the button needs
no `aria-label`. If the label becomes an icon, it does.

#### Browsers without `light-dark()`

No fallback needed for a theme, one needed for legibility. A browser older than
Chrome 123 or Safari 17.5 drops every `light-dark()` declaration as invalid at
computed-value time, so the tokens are unset and the page renders as unstyled
black on white. That is readable, ugly and only reachable on a browser more than
two years old. Add the two-line insurance anyway, before the token block:

```css
:root { --bg: #FBFAF8; --ink: #17181C; }
```

The rest can go unstyled. Do not build a full `@media (prefers-color-scheme)`
duplicate as a fallback: it doubles the token bytes for a browser share below
one percent and it reintroduces exactly the drift the single block was chosen to
avoid.

### 1.2 Copy to clipboard on the install command

**needs-JS.** There is no CSS path. Everything around it is CSS.

The command is `npx margyn /path/to/repo`. This is the highest-value interaction
on the page: it is the one control that leads to someone actually running the
tool.

#### What the platform guarantees

`navigator.clipboard.writeText()` is Baseline widely available since March 2020
([MDN][wt]). Three constraints matter:

1. **Secure context required.** On `http://` (except localhost)
   `navigator.clipboard` is `undefined`, so the failure is a TypeError on property
   access, not a rejected promise. Both paths need handling. Not academic for us:
   `margyn.xyz` had no TLS listener as of 2026-08-05 per RESUME.md, so the first
   deploy could plausibly be reached over plain HTTP.
2. **One error type for every cause.** The spec documents exactly one exception,
   `NotAllowedError`, covering insecure context, missing permission and missing
   user activation ([MDN][wt]). We cannot tell the user why it failed, so the
   failure UI must not try to.
3. **Transient user activation everywhere except Chromium.** Chromium accepts
   either the `clipboard-write` permission or transient activation and a granted
   permission persists. Firefox and Safari require transient activation and do not
   support the `clipboard-write` permission at all, with no plan to ([MDN][clip]).

The practical rule from that: keep the `writeText` call in the direct call stack
of the click handler. No `await` before it. An `await fetch(...)` ahead of the
copy consumes the activation and Safari refuses. Our command string is a
compile-time constant, so there is no reason to await anything, but it is the
mistake to guard against if the command ever becomes dynamic.

#### The failure path, which is the actual design question

The lazy pattern is `document.execCommand("copy")` on a hidden textarea as a
fallback. Reject it here. It is deprecated, it needs a real DOM node plus a
selection dance, it costs perhaps 200 bytes and on the browsers where the modern
API fails (insecure origin, activation lost) `execCommand` is usually blocked by
the same condition. Paying bytes for a fallback that fails alongside the primary
is worse than paying nothing.

**Better failure path: select the text so the user's own Ctrl+C works.**
`getSelection()` plus a `Range` needs no permission, no secure context and no
activation. It costs 150 bytes and it turns a dead end into one keystroke. The
label changes to "Press Ctrl+C" and the command sits highlighted.

Brand fit matters here. A tool whose pitch is "every finding ships a reproduction"
cannot show a green tick when the copy silently failed. Optimistic success on a
clipboard button is the same lie in miniature.

#### The implementation (needs-JS, 642 bytes as written, 482 collapsed)

```js
const cmd = document.getElementById("cmd");      // <code> holding the command
const btn = document.getElementById("copy");

btn.addEventListener("click", () => {
  const done = (state) => {
    btn.dataset.state = state;                    // "ok" | "manual"
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { delete btn.dataset.state; }, 1600);  // --t-hold
  };
  try {
    navigator.clipboard.writeText(cmd.textContent).then(
      () => done("ok"),
      () => { select(cmd); done("manual"); },
    );
  } catch {
    select(cmd); done("manual");                  // clipboard undefined on http
  }
});

function select(node) {
  const r = document.createRange();
  r.selectNodeContents(node);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}
```

`try/catch` wraps the call and `.then` takes the rejection, because the two
failure modes surface differently: `navigator.clipboard` being undefined throws
synchronously, a denied write rejects. Catching only one leaves an uncaught error
and a button that does nothing.

`clearTimeout` before setting the next one. Without it, a double click starts two
timers and the first one clears the state while the second click's feedback is
still meant to be showing, so the tick vanishes early. Small bug, very visible.

`textContent` is read from the DOM rather than duplicated in JS. One source of
truth for the command string, so the page can never copy something different from
what it displays. That is worth the extra lookup on a page selling precision.

#### The feedback, drawn in CSS (CSS-only, 293 bytes measured)

JS writes one attribute. CSS owns every pixel of the result, so the three labels
live in the stylesheet and not in three `textContent` assignments.

```css
#copy::after { content: "Copy" }
#copy[data-state="ok"] { color: var(--ok); border-color: var(--ok) }
#copy[data-state="ok"]::after { content: "Copied" }
#copy[data-state="manual"] { color: var(--high); border-color: var(--high) }
#copy[data-state="manual"]::after { content: "Press Ctrl+C" }
```

The `manual` state uses `--high` (`#A33A16` light, `#FF9366` dark), not `--ok`.
It is not an error, the user is not blocked, but it is not success either and it
demands an action from them. `--high` is the token that says "look here".

The label widths differ, so the button will resize mid-interaction unless it is
pinned. Set `min-width` on it, sized to the longest label, so the sticky bar's
layout is stable. Same class of problem as 1.6 and the same fix.

Note for 06b: this is a visual-only state change on a button whose accessible name
comes from `::after` content, which screen readers may or may not announce. The
announcement path is 06b's call, not this file's.

### 1.3 Hover, focus and active on every control

**CSS-only, all of it.** No control on this page needs JS for its own visuals.

Four controls exist: the primary button (Get my licence, Buy Watch), the ghost
button (Sign in, Sign out, Copy, the theme toggle), the text input and the
inline link. Every one gets three states plus disabled.

#### The shared rule

```css
button, input, a.btn {
  border: 1px solid var(--control);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  transition: background-color var(--t-hover) var(--ease),
              border-color var(--t-hover) var(--ease),
              filter var(--t-hover) var(--ease);
}
```

Name the properties. Never `transition: all`. `all` animates every computed
property including the ones a theme switch changes, so flipping the toggle would
crossfade every border and background on the page at once. That reads as a
laggy repaint rather than a deliberate transition. It also animates `content`
changes and layout properties that should snap.

`color` is deliberately absent from that list. Nothing on this page transitions
text colour on hover (see the state matrix below), so listing it would animate the
one property the theme switch changes most. The copy button is the exception, since
its feedback state does change text colour, so it carries `color` in its own rule
at `var(--t-state)` rather than adding it to every control.

#### The state matrix, tokens only

| Control | rest | hover | focus-visible | active | disabled |
| --- | --- | --- | --- | --- | --- |
| Ghost button | `--card` bg, `--control` border, `--ink` text | `--raised` bg, `--accent` border | rest plus 2px `--accent` outline, 2px offset | `--raised` bg, `translateY(1px)` | `--faint` text, `--line` border, no pointer |
| Primary button | `--accent` bg, `--bg` text, border `--accent` | `filter: brightness(1.08)` | 2px `--accent` outline, 2px offset | `translateY(1px)`, `brightness(0.94)` | `--line` bg, `--faint` text |
| Text input | `--card` bg, `--control` border | `--accent` border | 2px `--accent` outline, 1px offset | n/a | `--raised` bg, `--faint` text |
| Inline link | `--accent` text, 1px underline | underline thickens to 2px | 2px `--accent` outline, 2px offset | `--accent` at rest, no move | n/a |

Five notes on why:

**`filter: brightness()` on the primary, not a second colour.** The palette is
locked with no hover variants, so a hover shade has to be derived. `brightness()`
composites on the GPU, needs no new token and works in both modes from one
declaration. 1.08 lifts light-mode `#0F5C4E`; the same 1.08 on dark-mode `#57C9AE`
is already a bright accent so the lift is subtle, which is correct because a
bright surface on a dark page needs less change to read as touched.

**Hover moves the border to `--accent`, never the text colour.** Text colour
changes are the loudest thing on the page and every pair is already contrast
verified. Re-tinting text on hover risks the ratio and reads cheap. The border is
free to move.

**`:focus-visible`, never `:focus`.** `:focus` paints a ring after a mouse click
on a button, which is the single most common reason people delete focus rings and
break keyboard use. `:focus-visible` fires for keyboard and never for the mouse
click, so nothing has to be suppressed.

**`outline`, not `box-shadow`.** Outline does not participate in layout, follows
border radius in current browsers and survives `overflow: hidden` on an ancestor.
A `box-shadow` ring gets clipped by the terminal block's scroll container.

**Active is 1px of `translateY`, not a scale.** Scaling text resamples the glyphs
and reads soft. A 1px drop is the same gesture as a physical key and costs no
sharpness. It is `transform`, so it is compositor-only.

#### The whole matrix as CSS (CSS-only, 865 bytes measured)

```css
.primary { background: var(--accent); color: var(--bg); border-color: var(--accent) }
a { color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px }
@media (hover: hover) {
  button:hover, input:hover { border-color: var(--accent) }
  .ghost:hover   { background: var(--raised) }
  .primary:hover { filter: brightness(1.08) }
  a:hover        { text-decoration-thickness: 2px }
}
:focus-visible       { outline: 2px solid var(--accent); outline-offset: 2px }
input:focus-visible  { outline-offset: 1px }
button:active {
  transform: translateY(1px);
  transition-duration: var(--t-press);
  transition-timing-function: var(--ease-move);
}
.primary:active { filter: brightness(0.94) }
.ghost:active   { background: var(--raised) }
button:disabled { color: var(--faint); border-color: var(--line); cursor: not-allowed }
.primary:disabled { background: var(--line) }
```

#### Why hover is guarded by `(hover: hover)`

Without the guard, a tap on a phone leaves the hover state stuck on the button
until the next tap elsewhere, so the page looks frozen mid-interaction. Only the
`:hover` rules go inside it. `:active` and `:focus-visible` must stay outside, since
a touch device still fires both.

`input:focus-visible` gets 1px of offset rather than 2px because a text field sits
flush in a flex row where 2px of outline plus the gap reads as a doubled border.
The button has more air around it.

### 1.4 Sticky header

**CSS-only for the sticky itself. The scrolled state is the question.**

```css
header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--card);
  border-bottom: 1px solid transparent;
}
```

`position: sticky` needs no JS and no scroll listener. The decision is whether the
bar changes when the page scrolls under it.

**It must change.** The bar is `--card` (`#FFFFFF` light, `#16181C` dark) sitting
on `--bg` (`#FBFAF8`, `#0E0F12`). Those pairs are close on purpose, they are
surface tokens rather than contrast tokens, so at rest the bar reads as part of the
page. That is right at scroll zero and wrong once content slides beneath it: with
no edge, the terminal block's monospace appears to run into the session controls.

The cheapest honest change is the border going from `transparent` to `var(--line)`.
No shadow, no blur, no height change. It reads as a hairline appearing, which is
what a real edge is.

#### How to detect "scrolled", three options

| Option | Cost | Verdict |
| --- | --- | --- |
| IntersectionObserver on a 1px sentinel above the header | ~150 bytes JS, no scroll handler, fires off the main thread | **Use this** |
| `scroll` listener toggling a class | ~120 bytes plus a handler on every scroll frame | No. Same result, worse mechanics |
| `animation-timeline: scroll()` | 0 bytes JS | No. Not Baseline, see below |

Scroll-driven CSS animations would make this free and they are genuinely the
right long-term answer. They are not shippable as the only path: MDN still carries
"Limited availability. This feature is not Baseline because it does not work in
some of the most widely-used browsers" on `animation-timeline`, page last modified
2026-04-22 ([MDN][at]). A hairline that appears in Chrome and not in Safari is a
defect a judge can see.

Firefox is the blocker and it is not close. Bug 1324602, the tracker for letting
`layout.css.scroll-driven-animations.enabled` ride the trains to release, is
REOPENED with no target milestone, unassigned, P3, blocked on bug 1321405, and
whiteboarded `[platform-feature][webcompat:risk-moderate]` with an XL size
estimate. It absorbed a Firefox 148 report of `scroll-timeline-name` not working
as a duplicate, so the feature is still off by default in release
([Bugzilla][bz]). Checked 2026-08-05.

#### The sentinel (needs-JS, 165 bytes measured)

```html
<div id="top"></div>
<header>...</header>
```

```js
new IntersectionObserver(
  ([e]) => document.querySelector("header").classList.toggle("stuck", !e.isIntersecting),
  { threshold: 0 },
).observe(document.getElementById("top"));
```

```css
header.stuck { border-bottom-color: var(--line) }
```

Zero scroll handlers. The observer fires twice in a session, once crossing down
and once crossing up, instead of on every frame of every scroll.

The sentinel is a real empty div at the top of the body, not `::before` on the
header, because an observer needs an element and a pseudo-element is not one.

Optional CSS-only upgrade, safe because it is additive: put the same rule behind
`@supports (animation-timeline: scroll())` and drop the observer on browsers that
have it. Not worth it now. Two paths to maintain for 165 bytes is a bad trade, and
the observer works everywhere.

### 1.5 Scroll reveal: none. Here is the argument.

**No scroll reveal on this page.** Not reduced, not subtle. None.

Four reasons, in order of weight:

**1. It contradicts the product.** Margyn's claim is that other tools report
things that are not there. A page whose content materialises as you approach it is
performing exactly the kind of theatre the product exists to expose. The terminal
block is real captured stdout. Fading it in stages it, which is the one thing this
brand cannot afford to look like.

**2. Content that starts at `opacity: 0` is content that can fail to arrive.**
Every reveal implementation has a state where the trigger never fires and the text
stays invisible: JS blocked, an observer that misses a fast scroll to an anchor, a
browser that restores scroll position past the trigger on reload, print. The
failure mode is a blank page. For a hero and an install command, that is the whole
product gone. There is no equivalent failure mode for content that is simply
already visible.

**3. It costs the one thing that matters more.** A reveal on the hero delays the
install command, which is the page's single conversion event. Every reveal is time
between arriving and being able to copy the command.

**4. Nobody scrolls fast enough to notice its absence.** The page is one screen of
hero plus four short sections. The reveal budget would buy nothing a visitor would
miss.

**What replaces it.** Premium here comes from the states that respond to a
deliberate act: the hairline on the sticky bar, the 120ms hover, the copied
feedback, the session block resolving. Motion that answers an action always reads
better than motion that answers a scroll position, because the user caused it.

**The one exception and it is not a scroll reveal.** Content that appears in
response to a click (a minted licence, a findings list, an error) gets an entry
transition. Section 2.4 covers it. That is a state change the user asked for, not
decoration attached to a scroll offset.

### 1.6 Session state without layout jump

**needs-JS for the resolution. CSS-only for the reservation.**

This is the worst-behaved interaction on the page and the one most likely to ship
broken, because the bug only appears on a slow connection and never on localhost.

#### The failure, precisely

The current `web/public/index.html` renders `checking session…` and four buttons
all marked `hidden`. `paint()` in `app.mjs` unhides some of them. The chain before
that is: parse HTML, fetch the module, fetch the SDK from `esm.sh`, `tiun.init`,
`await tiun.waitForReady()`, then `await tiun.getUser()`. Two network round trips
to a third party before a single button appears.

So the bar is 32px of grey text, then it becomes a bar with two buttons in it and
everything below moves down. On a cold cache that gap is hundreds of milliseconds,
long enough for someone to have started reading or to have moved a cursor toward
the install command that is about to shift.

#### The fix: the bar's height never depends on its contents

```css
.session {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;         /* the tallest control, measured, not guessed */
}
.session[data-session="checking"] .signed-in,
.session[data-session="checking"] .signed-out { display: none }
.session[data-session="out"] .signed-in,
.session[data-session="in"]  .signed-out { display: none }
```

`min-height` is the whole fix and it is 22 bytes. The button is 40px tall including
its border, so reserve 40px and nothing below the bar can ever move, whatever
resolves into it.

One attribute switch drives visibility, so the module writes
`bar.dataset.session = "in"` once and never touches four `hidden` flags in
sequence. Four separate flag writes is how you get a frame where Sign in and Sign
out are both up.

#### What "checking" should actually show

Not a spinner. A spinner on a 40px bar is decoration for a wait the user did not
ask for and it needs either an SVG or a keyframe animation, both of which cost
bytes to say nothing.

Show the word, in `--muted`: `checking session`. Then one refinement worth its
bytes, a delay before it appears:

```css
.session[data-session="checking"] .status {
  color: var(--muted);
  opacity: 0;
  animation: fade var(--t-state) var(--ease) var(--t-patience) forwards;
}
@keyframes fade { to { opacity: 1 } }
```

If the session resolves inside `--t-patience` (400ms), which it will on a warm
cache, the user never
sees the word at all. They see a bar that was always correct. Only a genuinely slow
resolution earns an explanation. Reserved height means the late arrival still moves
nothing.

This is the one keyframe animation on the page. It is 105 bytes and it removes a
flash of "checking session" that would otherwise appear on every fast load, which
is a worse artefact than the wait it describes.

#### The two-signal problem

Signed in versus signed out is not the only axis. `paint()` also reads
`productAccess`, so the real states are checking, signed out, signed in without a
product, signed in with a product. Four states and `data-session` should carry all
four rather than pairing an attribute with three `hidden` flags:

`checking` | `out` | `in` | `paid`

Then every control's visibility is one CSS rule keyed off one attribute and no
combination of writes can produce an impossible bar. The `Get my licence` button
shows only under `paid`, which matches the existing comment in `app.mjs`: minting a
licence for a free account can only ever be refused.

**Also reserve the output area.** `#out` is empty until something renders into it.
It sits between the pricing area and the status block, so a minted licence appearing
pushes both down. Give it `min-height` matching one card or keep it last in the
document order. Empty with reserved space is honest here, since the area is labelled
as where findings appear.

#### Two bugs in the current `app.mjs`, both of which break this interaction

Found by reading `@tiun/sdk@0.9.1` as served from esm.sh (fetched 2026-08-05).

**1. `getUser()` is synchronous and the shape is wrong.** The SDK's method is
literally `getUser(){return{isAuthenticated:this._isAuthenticated,user:this._user}}`.
`app.mjs` line 22 does `await tiun.getUser().catch(() => null)`, which calls
`.catch` on a plain object and throws `TypeError: ... .catch is not a function`.
Then line 24 reads `user?.productAccess`, but `productAccess` does not appear
anywhere in the SDK bundle, so the entitlement it lives on is `getUser().user`,
not the wrapper. Correct read:

```js
const { isAuthenticated, user } = tiun.getUser();
const access = Object.keys(user?.productAccess ?? {}).length > 0;
```

That is not cosmetic. `paint()` throwing means the bar stays on `checking session`
forever, which is precisely the failure this section is about.

**2. Two of the four subscribed events do not exist.** The SDK's full event list,
from every `triggerEvent(` call site, is `ready`, `login`, `logout`, `userChange`,
`paywallShow`, `paywallHide`, `error`. `app.mjs` subscribes to `"login"`,
`"logout"`, `"checkout:complete"` and `"user:updated"`. The last two are silent
no-ops, so the bar never repaints after a successful checkout: the user pays, comes
back and the page still offers to sell them the thing they just bought. Subscribe
to `userChange` instead, which is what `handleUserChange` fires on every
`TIUN_USER_CHANGE` message from the snippet.

Both belong in an implementation ticket, not in this research file, but the session
interaction cannot be specified around an API that does not behave as the current
code assumes.

### 1.7 The terminal block as a real scroll region

**CSS-only.** Zero JS.

The block holds real captured stdout from a real run. Per RESUME.md the validated
run is against reconstructed moss `c6cbb45`, where the scanner found both ignored
files and the reproductions confirmed `ABSENT from HEAD` plus `PRESENT on disk`.
That output is evidence, so it must behave like a document the reader can inspect,
not a decorative strip with the interesting part cropped off.

#### The rules

```css
.term {
  max-height: 22rem;              /* about 20 lines at 1.5 line-height */
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--control) var(--raised);
  background: var(--raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 14px;
  font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  tab-size: 2;
}
```

Line by line, the ones that are decisions:

**`overflow: auto`, not `scroll`.** `scroll` paints a permanently disabled scrollbar
when the content fits, which is visual noise claiming there is more to see.

**`max-height` in `rem`, not `px` or `vh`.** The block should hold a fixed number of
lines regardless of the user's font size, so it scales with the text it contains.
`vh` would make it a viewport slice, which is a layout decision and belongs to 06b.

**`overscroll-behavior: contain`.** Without it, reaching the bottom of the block
hands the scroll to the page and the reader shoots past the section they were
reading. This is the single most annoying inner-scroll bug and it is one
declaration.

**`scrollbar-gutter: stable`.** Reserves the gutter so the monospace does not reflow
by a few pixels when the scrollbar appears or hides. On monospace, reflow is visible
as the columns stop lining up.

**`overflow-x` inherits `auto` from the shorthand and the lines must not wrap.**
Terminal output has meaningful columns. Wrapping a reproduction breaks the alignment
that makes it readable as a transcript. Horizontal scroll on the block is correct
here even though horizontal scroll is usually a smell.

#### Scrollbar colours

`scrollbar-color` is Baseline 2025, newly available since December 2025, Safari
being last to ship ([MDN][sc]). Older Safari ignores it and paints the OS scrollbar,
which is fine because `color-scheme: light dark` already makes that scrollbar dark
in dark mode. That is the second free win from choosing `color-scheme` as the theme
switch in 1.1.

Thumb `--control` on track `--raised` clears the 3:1 non-text contrast that MDN
flags for this property in both modes.

#### No fade mask at the bottom edge

The fashionable touch is a gradient mask over the last few lines to hint at more
content. Reject it. It makes real captured output look faded out, which on a page
about evidence reads as hiding the end of the log. A visible scrollbar (guaranteed
by `scrollbar-gutter: stable`) already says there is more and it says it without
touching a single pixel of the output.

#### One line of copy, not a JS affordance

Put the run's provenance above the block as static text: what repo, what commit,
what exit code. The reader then knows the block is a transcript before they scroll
it. That is worth more than any scroll affordance and costs no JS.

### 1.8 The smaller ones, briefly

**The five checks list.** Static text. No accordion, no tabs, no reveal. Five items
with a name and one line each fit on screen. An accordion here would hide four
fifths of the product's substance behind a click and it needs either `<details>`
styling or JS. **CSS-only, nothing to build.** If a name plus one line runs long,
`<details>` is the fallback, since it needs zero JS.

**Pricing area.** One paid tier, Watch, at USD 8.99 a month per RESUME.md. One tier
means no toggle, no monthly-yearly switch, no comparison table. The buy button is
the interaction and it is covered by 1.3 and 1.6. **CSS-only.**

Note the price is a confirmed number (8.99) and the Fix pack price was never
verified against the dashboard, so if a second product appears in the pricing area
its price must be checked before it renders. That is a content gate, not an
interaction one, but it lands in this area.

**Buy and licence buttons in flight.** Both make a network call. Both must disable
immediately on click, which `app.mjs` already does and both must show that they
are working. Reuse the `data-state` pattern from 1.2 rather than inventing a
second one: `data-state="busy"` with the label swapped in CSS. **needs-JS for the
attribute, CSS-only for the appearance.** Never leave a button enabled during a
checkout call, since a second click can open two checkout flows.

**The status block.** Static prose stating what is real pre-launch. No interaction
at all and it must not be collapsible. Collapsing the honest caveats is the exact
move an honest page does not make.

**Anchor links, if any.** `scroll-behavior: smooth` on `:root` is one declaration
and it is tempting. Skip it. With a sticky header, a smooth-scrolled anchor lands
with its heading under the bar unless `scroll-padding-top` is also set. That is
06b's layout territory. Instant jumps land in the same wrong place but at least do
not animate to it.

### 1.9 The JS budget, itemised

Every number in the "ours" table is measured with `wc -c` on the exact snippet
printed above. "Collapsed" is whitespace and comments stripped, which is what
ships, since there is no minifier in the pipeline and the file is hand written.

#### Ours, the interaction code

| Item | Section | As written | Collapsed | CSS-only alternative? |
| --- | --- | --- | --- | --- |
| Theme head script | 1.1 | 491 | 481 | No. Override needs storage |
| Copy to clipboard | 1.2 | 642 | 482 | No. Clipboard has no CSS path |
| Session attribute switch | 1.6 | 300 | 300 | No. One attribute write per state |
| Header sentinel observer | 1.4 | 165 | 165 | Yes, when Firefox ships `animation-timeline` |
| Busy state on buy/licence | 1.8 | 85 | 85 | No |
| **New interaction JS** | | **1,683** | **1,513** | |

Plus what already exists: `web/public/app.mjs` is 5,010 bytes today. The session
switch replaces the four `hidden` writes in `paint()`, so the module gets slightly
shorter, not longer. Call the module 5,000 bytes after this work, so about **6,700
bytes of our own JS** in total.

#### The CSS these buy back

Same method, `wc -c` on the rules as they would ship.

| Item | Section | Bytes |
| --- | --- | --- |
| Control state matrix, all four controls | 1.3 | 865 |
| Token block, both modes | 1.1 | 511 (434 collapsed) |
| Session visibility plus delayed fade | 1.6 | 381 |
| Terminal scroll region | 1.7 | 357 |
| Copy feedback states | 1.2 | 293 |
| Reduced-motion block | 2.5 | 239 |
| Sticky header plus stuck rule | 1.4 | 226 |
| Theme label | 1.1 | 222 |
| Card entry keyframe | 2.4 | ~110 |
| Motion token block | 2.1 | ~240 |
| **Interaction CSS** | | **3,444** |

That CSS is inline in the head, so all 3.4 KB is on the critical render path. It is
still the right trade against moving any of it into JS, since JS that styles has to
wait for the module and the module waits for the network.

#### Third party, which is where the page's weight actually is

Measured live against the sandbox host on 2026-08-05 using the snippet id in
`.dev.vars`.

| Item | Raw | Gzip |
| --- | --- | --- |
| `esm.sh/@tiun/sdk@0.9.1` re-export shim | 139 | n/a |
| `esm.sh/@tiun/sdk@0.9.1/es2022/sdk.mjs` | 8,271 | 2,954 |
| Snippet `background_js` (injected by `tiun.init`) | 485,729 | 141,698 |
| Snippet `background_css` (injected by `tiun.init`) | 55,050 | 9,276 |
| **Third-party total** | **549,189** | **~154,000** |

#### What that means for the design

The Tiun snippet is 486 KB of JS that `tiun.init()` injects as a `<script async>`
plus a stylesheet, both built from `${base}/v2/snippets/${id}/background_js`. It
contains a UI framework (Vue and React strings both appear in the bundle). It is 80
times our entire page.

Three consequences that shape every decision above:

**1. Optimising our own bytes past this point is theatre.** Choosing the 165-byte
observer over the 120-byte scroll handler was not a byte decision, it was a
mechanics decision. Say so honestly rather than claiming a size win. The place to
be strict is the inline CSS on the critical path, which lands before any of this.

**2. The session cannot resolve fast, ever.** 142 KB gzipped has to arrive, parse
and post `TIUN_SNIPPET_INITIALIZED` back before `waitForReady()` settles. That is
the whole justification for 1.6: reserved height plus a 400ms-delayed status word,
because the wait is structural and cannot be engineered away from our side.

**3. Everything we own must work without it.** The theme toggle, the copy button,
the terminal scroll and every hover state must be live before the snippet lands and
must survive it never landing. That is why the theme script is inline in the head
and not in the module that statically imports the SDK. Only sign in, checkout and
the licence mint may depend on it.

Total page cost, honestly stated: about **6.7 KB of our JS**, **3.4 KB of
interaction CSS** and **~154 KB gzipped of Tiun** that buys sign in and checkout.
Our own half of the page is under 2% of what it downloads.

## PART 2. MOTION

### 2.1 The token set, paste-ready

```css
:root {
  /* curves */
  --ease:       cubic-bezier(0.22, 1, 0.36, 1);
  --ease-move:  cubic-bezier(0.65, 0, 0.35, 1);
  /* durations */
  --t-press:      90ms;
  --t-hover:     120ms;
  --t-state:     200ms;
  --t-exit:      150ms;
  /* timings that are not durations */
  --t-hold:     1600ms;
  --t-patience:  400ms;
}
```

Eight values and the page uses no ninth. A bespoke duration in one rule is the
tell that nobody owns the motion and it is exactly the sort of inconsistency a
design-system review flags as a defect ([smoothui][su]).

### 2.2 Why each value

**`--ease: cubic-bezier(0.22, 1, 0.36, 1)`.** The default for everything. Strong
ease-out: most of the distance is covered in the first third, then it settles.
That front-loading is what reads as responsive, because the element has visibly
started before the user's eye arrives. Its opposite, `ease-in`, is the classic
cheap-looking curve on UI: nothing happens for the first 40% and every interaction
feels like it is thinking. Current design-system guidance names ease-out the
default for almost everything and prohibits `ease-in` on UI outright
([smoothui][su]).

**`--ease-move: cubic-bezier(0.65, 0, 0.35, 1)`.** Symmetric ease-in-out, used
only for something already on screen that moves and comes back, which on this page
is the 1px press. A press needs to accelerate away from rest and decelerate into
its stop or it reads as a jerk rather than a push.

Two curves. Not four. The page has no hero choreography and one CTA, so the
emphasized and soft curves in a full system have nothing here to attach to.

**`--t-press: 90ms`.** Under Nielsen's 0.1 second threshold, which is "about the
limit for having the user feel that the system is reacting instantaneously"
([NN/g][nn]). A press is direct manipulation. Anything the user can perceive as a
delay between finger and pixel breaks that, so this value is chosen to sit below
the perceptual floor rather than to look like anything.

**`--t-hover: 120ms`.** Hover fires dozens of times per session as the cursor
crosses the bar, so it has to be the shortest visible duration on the page.
Contemporary guidance puts hover "under 150ms or none" and current systems ship a
120ms fast token for exactly this band ([smoothui][su]). Older desktop guidance
lands in the same place from a different direction: Material's archive specifies
150 to 200ms for desktop, faster and simpler than mobile ([Material][mat]), and
SAP Fiori says a hover or down state "should last no longer than 150 ms"
([Fiori][sap]). 120ms is inside all three.

The cheap-looking alternative is 300ms, which is the default a lot of hand-written
CSS lands on because `transition: 0.3s` types easily. At 300ms the border colour is
still moving after the cursor has left, so a quick pass across a row of buttons
leaves three of them mid-transition. That smear is the single clearest visual tell
of unconsidered CSS.

**`--t-state: 200ms`.** For a discrete state change the user asked for: the copied
feedback appearing, a card entering, the header's hairline. 200ms is long enough to
be seen as a transition rather than a jump cut and short enough to stay under the
"instant" ceiling; the guidance is that under 200ms feels instant and 300ms and up
starts to feel sluggish ([smoothui][su]).

**`--t-exit: 150ms`.** Exits at about three quarters of the entrance is the
convention and 150 is 75% of 200 ([smoothui][su]). The reason is not symmetry, it
is attention: an entrance has to be noticed, a departure only has to not be
abrupt. Equal in and out makes the exit feel like it is loitering.

**`--t-hold: 1600ms`.** Not a duration, a dwell. How long "Copied" stays before
reverting. Under a second reads as a flicker the user cannot be sure they saw,
which on a confirmation is the worst outcome. Over two seconds and a second click
finds the button still claiming the result of the first. 1600ms is comfortably
inside Nielsen's 10 second attention limit and comfortably outside doubt.

**`--t-patience: 400ms`.** The delay before "checking session" appears (1.6).
Chosen relative to Nielsen's 1 second flow-of-thought limit: a wait shorter than
this needs no explanation, so explaining it creates the very flicker it was meant
to cover. 400ms leaves 600ms of the budget for the message to be read before the
wait becomes genuinely disruptive.

### 2.3 Where each token is used

| Interaction | Properties | Duration | Curve |
| --- | --- | --- | --- |
| Button, input, link hover | `background-color`, `border-color` | `--t-hover` | `--ease` |
| Primary hover | `filter` | `--t-hover` | `--ease` |
| Active press | `transform` | `--t-press` | `--ease-move` |
| Focus ring | none | 0 | none |
| Copied feedback in | `color`, `border-color` | `--t-state` | `--ease` |
| Copied feedback out | `color`, `border-color` | `--t-exit` | `--ease` |
| Header hairline | `border-bottom-color` | `--t-state` | `--ease` |
| "Checking session" appearing | `opacity` | `--t-state` after `--t-patience` | `--ease` |
| Rendered card entering | `opacity`, `transform` | `--t-state` | `--ease` |
| Theme switch | none | 0 | none |

Two zeroes in that table are decisions, not omissions.

**The focus ring never animates.** A keyboard user tabbing through the bar needs to
know where they are instantly and a fading ring means that during the fade the
answer is ambiguous. It also compounds: hold Tab and every ring is mid-fade. Focus
is the one state that must be binary.

**The theme switch never animates.** Crossfading eleven tokens across every surface
on the page is hundreds of milliseconds of a half-lit interface and there is no
duration at which that looks deliberate. It is also why 1.3 forbids
`transition: all`, since `all` would produce this crossfade by accident. Instant is
correct: the user asked for a different theme, not for a dissolve between two.

An honest caveat: `color-scheme` is not an animatable property, so with the
`light-dark()` strategy the switch is instant whether we want it or not. The
decision only matters as a reason not to reintroduce it by hand.

### 2.4 The one entry transition

Content rendered after a click (a minted licence, a findings list, an error) gets
one entry and it is the same shape every time:

```css
.card {
  animation: enter var(--t-state) var(--ease) both;
}
@keyframes enter {
  from { opacity: 0; transform: translateY(4px) }
}
```

4px, not 12 or 20. The point is to signal that this content is new, not to travel.
A larger distance reads as a slide-in, which is decoration and it is the class of
motion accessibility guidance actually warns about: MDN names "scaling or panning
large objects" as vestibular triggers ([MDN][prm]). 4px is neither.

`opacity` and `transform` only. Both are compositor properties, so the animation
never triggers layout or paint and cannot stutter while the Tiun snippet is parsing
486 KB on the main thread. That constraint is real here, not theoretical.

An animation rather than a transition, so it fires on insertion with no
`@starting-style` and no double `requestAnimationFrame` to force a first frame.
`@starting-style` is Baseline 2024 and would work, but the transition version needs
the element inserted in one state and changed in another, which means JS timing;
the keyframe version is one CSS rule that runs when the node appears.

**No stagger.** A findings list could stagger its items by 40ms each. Do not. Ten
findings would take 400ms to finish arriving and these are audit results: the
reader wants to count them, not watch them deal out like cards. Stagger is for
marketing sections and this list is the product's output.

### 2.5 `prefers-reduced-motion`

The instruction to get right: `reduce` does not mean `none`. The MDN definition is
that the setting conveys "that the user prefers an interface that removes, reduces,
or replaces motion-based animations", all three being valid responses ([MDN][prm]).
MDN's own example replaces rather than removes: a `transform: scale()` pulse becomes
an `opacity` dissolve, described as "a more muted animation that is not a vestibular
motion trigger" ([MDN][prm]).

#### Why removing a transition can be worse than shortening it

Three concrete failures from a blanket `transition: none`:

**1. State changes lose their causal link.** With no transition, the copied feedback
becomes an instantaneous colour swap. On a 40px button that is a flicker and a
flicker is harder to interpret than a fast fade: the user cannot tell whether the
change was their click or a repaint. Reduced-motion users are not asking for
ambiguity, they are asking not to be moved.

**2. Zero-duration transitions fire no events.** A `transitionend` handler on a
zero-duration transition never runs, so any JS gated on it stalls silently. This is
the reason the canonical reset uses a near-zero duration rather than zero: Eric
Bailey's snippet sets `animation-duration: 0.001ms !important` and
`transition-duration: 0.001ms !important` so anything depending on the animation
running at all "will activate successfully (unlike using a declaration of
`animation: none`)" ([CSS-Tricks][ct]). Our code has no `transitionend` handler
today. Writing one later against a stylesheet that killed transitions is a bug
waiting to be introduced and 0.001ms costs nothing to be safe from it.

**3. A flash is motion too.** An abrupt appearance is a high-frequency luminance
change across a region. For photosensitivity that is worse than the same change
eased over 100ms. Removing motion to help can hurt a different group.

#### What actually changes on this page

The honest answer: very little, because the motion budget was already small. That
is the point. A page designed with reduced motion in mind needs no separate
reduced-motion design.

| Item | Full motion | Reduced | Why |
| --- | --- | --- | --- |
| Hover colour and border | 120ms | **80ms, kept** | Colour is not vestibular. Shortened, not removed, so the causal link survives |
| Primary `filter` hover | 120ms | **80ms, kept** | Same. Brightness is not movement |
| Active 1px press | 90ms transform | **removed** | It is movement. 1px is trivial but this is the honest place to comply |
| Copied feedback | 200ms colour | **80ms, kept** | This is the confirmation of the page's key action. Never make it a flicker |
| Header hairline | 200ms | **80ms, kept** | Border colour, no movement |
| "Checking session" fade | 200ms after 400ms | **opacity kept, delay kept** | The delay is not motion. It is what stops the flash |
| Card entry | opacity plus 4px | **opacity only, 150ms** | Drop the translate, keep the fade. MDN's own replace-not-remove pattern |
| Focus ring | instant | instant | Already instant |
| Theme switch | instant | instant | Already instant |

Movement goes. Colour and opacity stay, shortened. That distinction maps directly
onto what the guidance names as triggers: scaling and panning large objects
([MDN][prm]), with fades explicitly the safer substitute
([Princeton][pri]).

#### The block

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --t-hover: 80ms;
    --t-state: 80ms;
    --t-exit:  80ms;
  }
  button:active { transform: none }
  .card { animation-duration: 150ms }
  @keyframes enter { from { opacity: 0; transform: none } }
}
```

Retuning the tokens is most of the work, which is the payoff for having tokens at
all. Three overrides plus two rules, about 220 bytes and every duration on the page
moves at once.

`--t-hold` and `--t-patience` are deliberately not overridden. Neither is motion.
Shortening the dwell would make the confirmation harder to catch and shortening the
patience delay would reintroduce the flash. Reduced motion is not reduced time.

Note the redeclared `@keyframes enter` inside the media block. Keyframes cannot be
partially overridden, so the whole rule is restated. That is the one duplication in
this file and it is unavoidable.

#### What we do not do

**No blanket `* { transition-duration: 0.001ms !important }`.** It is the right
default for a large site nobody can audit and it is wrong here: this page has nine
animated things, all listed above, so a targeted response is achievable and strictly
better. The blanket reset would also kill the copied feedback, which is the one
piece of motion a reduced-motion user most needs to see.

**No JS check.** `matchMedia("(prefers-reduced-motion: reduce)")` in the module
would let JS branch on the preference. Nothing here needs it and reading a media
query in JS costs bytes to duplicate a decision CSS already owns.

### 2.6 Motion budget

Nine animated things on the whole page: four hover states, one press, one copied
feedback, one hairline, one status fade, one card entry. That is the complete list.
Anything not on it does not animate.

The test for adding a tenth: name the user action that causes it. Hover, click,
focus, a network response. If the answer is "the page loaded" or "you scrolled to
it", it does not go in.

## Open questions for implementation

1. **`min-height` on the session bar is 40px by assertion.** Measure the rendered
   button in both modes before committing the number. Border plus padding plus a
   14px line box should land at 40, but a guess in a CSS file is the sort of thing
   this product exists to catch.
2. **The `[style*="dark"]` selector for the theme label** couples the label to the
   head script writing exactly one declaration to `<html>`. Add a comment at both
   ends. If a later change writes anything else to that attribute, the label lies
   while the theme is correct, which is the hardest kind of bug to notice.
3. **The two `app.mjs` bugs in 1.6 are unverified against a live sandbox.** They are
   read off the SDK source, which is strong evidence, not a reproduction. Per
   RESUME.md the end-to-end sandbox path has not been re-run since the rename, so
   confirm both by clicking through before treating them as fixed.
4. **`--ease` on `filter` is untested for banding.** `brightness()` on the dark-mode
   accent may band on a low-bit display. Look at it, do not assume.

## Sources

All checked 2026-08-05.

[ld]: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark
[wt]: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
[clip]: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
[at]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
[sc]: https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color
[prm]: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
[bz]: https://bugzilla.mozilla.org/show_bug.cgi?id=1324602
[nn]: https://www.nngroup.com/articles/response-times-3-important-limits/
[ct]: https://css-tricks.com/revisiting-prefers-reduced-motion/
[su]: https://skills.smoothui.dev/docs/motion
[mat]: https://material.io/archive/guidelines/motion/duration-easing.html
[sap]: https://experience.sap.com/fiori-design-web/v1-74/animation/
[fouc]: https://codefronts.com/snippets/css-variable-dark-mode-system/anti-fouc-head-script/
[pri]: https://digital.accessibility.princeton.edu/how/content/animations

- [MDN, `light-dark()`][ld]. Baseline 2024, newly available: "Since May 2024, this
  feature works across the latest devices and browser versions." Requires
  `color-scheme: light dark`.
- [MDN, `Clipboard.writeText()`][wt]. Secure context required. One documented
  exception, `NotAllowedError`, covering every denial cause. Baseline widely
  available since March 2020.
- [MDN, Clipboard API][clip]. Chromium accepts the `clipboard-write` permission or
  transient activation and a granted permission persists. "The `clipboard-read` and
  `clipboard-write` permissions are not supported (and not planned to be supported)
  by Firefox or Safari", where "writing requires transient activation."
- [MDN, `animation-timeline`][at]. "Limited availability. This feature is not
  Baseline because it does not work in some of the most widely-used browsers." Page
  last modified 2026-04-22.
- [Bugzilla 1324602][bz]. Firefox ship tracker for
  `layout.css.scroll-driven-animations.enabled`. REOPENED, unassigned, P3, no target
  milestone, blocked on 1321405.
- [MDN, `scrollbar-color`][sc]. Baseline 2025, newly available: "Since December
  2025". Notes the 3:1 thumb-to-track contrast requirement.
- [MDN, `prefers-reduced-motion`][prm]. "removes, reduces or replaces
  motion-based animations." Names "scaling or panning large objects" as vestibular
  triggers. Its example replaces a scale pulse with an opacity dissolve.
- [Nielsen Norman Group, response times][nn]. 0.1s instantaneous, 1s flow of
  thought, 10s attention.
- [CSS-Tricks, revisiting prefers-reduced-motion][ct]. Eric Bailey's reset uses
  `0.001ms !important`, not zero, so animation-dependent behaviour still fires.
- [smoothui motion docs][su]. Duration tokens 120/200/280/400/600ms, ease-out
  `cubic-bezier(0.22, 1, 0.36, 1)` as the default, ease-in-out
  `cubic-bezier(0.65, 0, 0.35, 1)`, hover "under 150ms or none", exits at about 75%
  of entrances, `ease-in` on UI prohibited.
- [Material Design archive, duration and easing][mat]. Desktop animations "should
  last 150ms to 200ms."
- [SAP Fiori, motion design][sap]. A hover or down state "should last no longer than
  150 ms."
- [codefronts, anti-FOUC head script][fouc]. The render-blocking inline head script
  pattern, read storage, stamp the root "BEFORE the browser paints a single pixel."
- [Princeton digital accessibility, animations][pri]. "Prefer fade-based transitions
  to slide-based transitions. Fading content in and out is unlikely to affect
  motion-sensitive users."

Measured locally, not cited: all byte counts (`wc -c`), the SDK and snippet payload
sizes (`curl` against `esm.sh` and `api-sandbox.tiun.live` with the snippet id from
`.dev.vars`) and the two `app.mjs` bugs (read off the served `sdk.mjs`).


















