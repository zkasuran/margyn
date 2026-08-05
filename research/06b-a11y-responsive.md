# Margyn landing page: accessibility and responsive plan

Scope: accessibility and responsive layout only. Interaction and motion are a
separate document. Every CSS block here is written for one hand-authored HTML
file with inline CSS plus one small ES module, no framework and no build step.

The palette is locked and already verified for text contrast in both modes, so
no contrast maths is repeated here. Two pairs this document introduces are
flagged for measurement at the end of Part 1.

## Part 1. Accessibility

### 1.1 Landmarks

Six landmarks, all of them native elements. No `role` attributes, because a
native element already carries the role and a redundant role is one more thing
to keep correct.

| Region | Element | Accessible name | Why |
| --- | --- | --- | --- |
| Sticky top bar | `<header>` | none needed | One banner per page, so it needs no name. |
| Session controls inside the bar | `<nav aria-label="Account">` | "Account" | A second nav on the page needs a distinguishing name. |
| Page body | `<main id="main">` | none needed | Target of the skip link. |
| Findings and licence output | `<section aria-labelledby="out-h">` inside main | its own `h2` | Content is injected here, so it needs a stable named region. |
| Pre-launch status | `<aside aria-labelledby="status-h">` | its own `h2` | Complementary to the pitch, not part of it. |
| Footer | `<footer>` | none needed | One contentinfo per page. |

Rules that go with them:

- `<header>` and `<footer>` map to banner and contentinfo only when they are
  direct children of `<body>`. Nested inside `<main>` or a `<section>` they map
  to `generic` and the landmark is lost. Keep both at body level.
- One `<main>`, not two. The findings area is a `<section>` inside it.
- A skip link is the first focusable thing in the DOM:
  `<a class="skip" href="#main">Skip to content</a>`. It must reappear on
  focus rather than be display:none. It must also clear the sticky bar (CSS in 2.2).
- Any decorative SVG gets `aria-hidden="true"` and `focusable="false"`.

### 1.2 Heading order

One `h1`. No level is skipped. The visual size of a heading is set by a class,
never by picking a different level, so the outline stays honest.

```
h1  Proves your checks do not check anything.        (hero, the only h1)
h2  What Margyn found in its own repo               (terminal output block)
h2  The five checks
    h3  ignored-source
    h3  no-assertion
    h3  mutation
    h3  unrun-check
    h3  lint-blindspot
h2  What it does not do
h2  Your code never leaves your machine
h2  Pricing
    h3  Free, the four static checks
    h3  Watch, 8.99 a month
h2  Your findings            (id="out-h", the injected region)
h2  Where this actually is   (id="status-h", pre-launch status)
```

Three notes on this tree:

- The brand word in the sticky bar is **not** a heading. It is a link to `/`
  wrapped around the wordmark or plain text if there is nowhere to go. A
  heading inside `<header>` would add a phantom level above the hero.
- The headline is the `h1` and the tagline is the `<p>` after it. Do not mark
  the tagline as `h2`. If both lines must read as one unit, put the tagline in a
  `<p>` and leave it out of the outline.
- Every check name inside an `h3` is code, so it is `<h3><code>ignored-source</code></h3>`.
  Screen readers do not announce `<code>`, which is why the severity is spelled
  out in words next to it (see 1.5) rather than left to a coloured pill.

### 1.3 Focus visible, one ring that works in both modes

The ring colour is `ink`. In light mode that is #17181C sitting on near-white
surfaces. In dark mode it is #F0F1F3 sitting on near-black surfaces. Every
focusable control on this page sits on `bg`, `card` or `raised`, all three of
which are already measured against `ink`, so one token covers both modes and no
mode-specific focus rule is needed.

`outline-offset` is what makes it universal. The 2px gap renders in the parent
surface colour, so even a control whose own background is `ink` (the primary
button in light mode) gets a visible light gap between the button and the dark
ring.

```css
:root {
  --focus: var(--ink);
}

/* Kill the default only where a replacement is guaranteed. */
:where(a, button, input, textarea, select, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

/* Never remove the ring for mouse users by clearing :focus wholesale.
   :focus-visible already excludes pointer focus on every 2026 engine. */
:where(a, button, input, textarea, select, summary, [tabindex]):focus:not(:focus-visible) {
  outline: none;
}
```

Three details that are easy to get wrong here:

- Do not use `box-shadow` for the ring. Forced colors mode forces `box-shadow`
  to `none`, so a shadow-based ring disappears for exactly the users who need it
  most. `outline` survives and its colour is swapped to the system palette.
- `outline` follows `border-radius` in all current engines, so a rounded button
  gets a rounded ring with no extra work.
- 3px, not 1px. WCAG 2.2 SC 2.4.13 Focus Appearance asks for a focus indicator
  at least as large as the area of a 2px thick perimeter of the control, at 3:1
  against adjacent colours. It is AAA, so it is not a pass or fail gate for an
  AA target, but 3px clears it for free and reads better on a phone.

### 1.4 The theme toggle

**Decision: three states, System / Light / Dark, as a native radio group.** Not
a two-state `aria-pressed` button.

Four reasons, in order of weight.

1. **Two states cannot get back to the system preference.** The page boots from
   `prefers-color-scheme`. The first click writes an explicit choice to storage.
   With only two states the user is stuck with that choice forever, so someone
   whose phone flips to dark at sunset now has a light page and no control that
   undoes the override. The escape hatch is clearing site data. That is a real
   trap and it is the whole reason the third state exists.
2. **A toggle button's state is genuinely ambiguous.** `aria-pressed="true"` on
   a button labelled "Dark mode" reads as "Dark mode, toggle button, pressed",
   which is fine. The same button labelled with the action ("Switch to dark")
   plus a pressed state reads as nonsense. Half the toggles in the wild get this
   wrong. A radio group has no such failure mode: the label is the destination
   state and `checked` is whether you are there.
3. **Native radios need no ARIA at all.** `role`, `aria-checked`, arrow-key
   roving focus, `aria-required` grouping and the focus ring all come free from
   `input[type=radio]` inside a `fieldset`. Nothing to keep in sync in JS. In
   forced-colors mode the browser draws real radio indicators, so the control
   survives high contrast with no extra rule.
4. **No live region is needed.** Selecting a radio announces its own new state
   ("Dark, radio button, checked, 3 of 3"). The `aria-live` region that the
   web.dev theme-switch pattern relies on exists only because a button whose
   `aria-label` mutates is otherwise silent. Choose the pattern that announces
   itself and delete the live region. One fewer moving part.

The cost is footprint: three targets in a sticky bar instead of one. Part 2.2
spends that budget deliberately.

#### The markup

`fieldset` and `legend` give the group its accessible name. The legend is
visually hidden, never `display:none`, because a hidden legend still names the
group for a screen reader.

```html
<fieldset class="themeset">
  <legend class="sr-only">Colour theme</legend>

  <input type="radio" name="theme" id="th-sys" value="system" class="sr-only" checked>
  <label for="th-sys">
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16">…</svg>
    <span class="lbl">System</span>
  </label>

  <input type="radio" name="theme" id="th-light" value="light" class="sr-only">
  <label for="th-light">
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16">…</svg>
    <span class="lbl">Light</span>
  </label>

  <input type="radio" name="theme" id="th-dark" value="dark" class="sr-only">
  <label for="th-dark">
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16">…</svg>
    <span class="lbl">Dark</span>
  </label>
</fieldset>
```

What is deliberately absent and why:

- No `role="radiogroup"`. `fieldset` plus same-`name` radios already produce a
  radio group. Adding the role on the fieldset removes its native group
  semantics in some engines and gains nothing.
- No `aria-checked`. It would duplicate the DOM `checked` state and go stale.
- No `aria-live`. Covered above.
- No `aria-label` on the fieldset when a `legend` is present. Two names compete
  and `aria-label` wins, so the visible legend would stop being the name.
- No `title` on the labels. A tooltip is not an accessible name and it does not
  appear on touch.

#### The visually hidden utility

The radios are hidden with `sr-only`, not `display:none` or `visibility:hidden`,
because both of those remove the input from the accessibility tree and from tab
order. This is the standard clip pattern:

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

The focus ring then has to be painted on the `<label>`, since the input itself
has no visible box:

```css
.themeset input:focus-visible + label {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}
.themeset input:checked + label {
  background: var(--raised);
  border-color: var(--control-border);
  color: var(--ink);
}
```

`fieldset` needs a reset, since its default border and padding will not match
the bar: `border:0; padding:0; margin:0; display:flex; gap:2px;`. Keep it a
`fieldset` even after the reset. The element is doing semantic work, not visual
work.

#### Wiring, in one paragraph

`:root { color-scheme: light dark }` plus tokens declared twice, once under
`@media (prefers-color-scheme: dark)` and once under `:root[data-theme=dark]`,
covers all three states. System means no `data-theme` attribute at all, so the
media query decides. Light and dark set `data-theme` on `<html>` and the
attribute selector wins on specificity. The module writes the attribute and the
`localStorage` key on `change` and it reads storage in a tiny inline script in
`<head>` so there is no flash of the wrong theme before the module loads. Also
set `color-scheme: only light` or `only dark` on the root when an explicit choice
is active, so form controls, scrollbars and the URL bar follow the page rather
than the OS.

Without JavaScript the radios do nothing and the page still renders in the
system theme. That is an acceptable degradation: the control is a preference, not
a function, so it needs no `<noscript>` handling. Do not hide it when JS is
absent, because detecting that reliably in inline CSS costs more than it saves.

Two contrast pairs this section introduces that are not in the verified set:
`ink` on `raised` for the checked label (light #17181C on #F5F3EF, dark #F0F1F3
on #1D2025) and `control-border` used as the checked label's border against
`raised` rather than against `bg`. The text pair is almost certainly fine in both
modes. The border-on-raised pair is the one to run through the script, because
`control-border` was measured at 3.38:1 and 3.39:1 against `bg`. `raised` is
a different surface. Non-text contrast needs 3:1 under SC 1.4.11, so there is
very little headroom.

### 1.5 Touch target sizes

The two criteria differ, so name them separately.

| Criterion | Name | Level | Minimum | Standard |
| --- | --- | --- | --- | --- |
| SC 2.5.5 | Target Size (Enhanced) | AAA | 44 by 44 CSS px | WCAG 2.1, carried into 2.2 renamed with "(Enhanced)" |
| SC 2.5.8 | Target Size (Minimum) | AA | 24 by 24 CSS px | new in WCAG 2.2 |

**Which applies here: SC 2.5.8, 24 by 24 CSS px, Level AA.** That is the
conformance target, because AA is the level every accessibility statement, audit
and procurement checklist actually asks for. SC 2.5.5 at AAA is the aspiration.
The number to hold the page to is 24.

The house minimum on this page is 44, which satisfies both. The reasoning is not
conformance, it is that this page is going to be looked at on a phone by people
deciding whether to trust a security-adjacent developer tool and a 24px control
is technically passing and physically annoying.

So: **every interactive control gets a 44px minimum box.** One rule, applied at
the base and not inside a media query, because a small target is small on a
desktop trackpad too.

```css
:where(button, .btn, .themeset label, a.nav, input, select) {
  min-height: 44px;
  min-width: 44px;      /* on icon-only controls; text buttons exceed it anyway */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

Notes on the exceptions, because two of them apply to this page:

- **Inline** exception: a link inside a sentence is exempt, since its size is
  constrained by the line-height of surrounding non-target text. The footer links
  and any in-prose link to the repo are covered by it. They still get generous
  padding, but they are not a failure at their natural size.
- **Spacing** exception: a target under 24px passes if a 24px diameter circle
  centred on its bounding box does not intersect another target's circle. That is
  the fallback for a dense control cluster. This page does not need it, because
  nothing is under 24px.
- The measurement is unaffected by page zoom, so "the user can pinch to zoom" is
  not a defence.

One thing to check by hand: the theme radios are `sr-only` inputs with the
clickable area on the `<label>`. The label is the target, so the 44px goes on the
label. A 1px clipped input does not fail 2.5.8, because the pointer target is the
label, but an automated checker may flag the input. Expect that and note it.

### 1.6 Colour never carries the meaning

SC 1.4.1 Use of Color, Level A: colour is not used as the only visual means of
conveying information, indicating an action, prompting a response or
distinguishing a visual element. Severity is exactly the kind of information
that fails this and the current build already fails it: `.f` sets a
`border-left: 3px solid var(--hi)` and nothing else marks the finding.

The five checks and how each one carries its severity without hue:

| Check | Severity | The word | The shape | The colour |
| --- | --- | --- | --- | --- |
| `ignored-source` | high | "high" | filled square glyph | `high` |
| `no-assertion` | high | "high" | filled square glyph | `high` |
| `mutation` | high, part of Watch | "high, part of Watch" | filled square glyph | `high` |
| `unrun-check` | medium | "medium" | hollow square glyph | `muted` |
| `lint-blindspot` | medium | "medium" | hollow square glyph | `muted` |

Three independent channels, any one of which is sufficient on its own.

1. **The word.** "high" or "medium" is printed in the badge, in text. Not a
   tooltip, not an `aria-label` on a coloured dot, not a legend elsewhere on the
   page. Text in the badge itself. This alone satisfies 1.4.1.
2. **The shape.** Filled for high, hollow for medium. The glyph is a
   `<span aria-hidden="true">` next to the word, so it is not read twice.
   Filled versus hollow survives greyscale, monochrome printing and every form
   of colour blindness and it also survives forced-colors mode, where the fill
   becomes `CanvasText` and the hollow becomes a `CanvasText` border.
3. **The border weight.** High findings get a 3px left border, medium get 1px.
   That is a redundant third cue, so it is a nice-to-have.

```html
<h3><code>ignored-source</code>
  <span class="sev sev-high">
    <span class="glyph" aria-hidden="true">&#9632;</span>high
  </span>
</h3>
```

```css
.sev { font: 600 11px/1 inherit; letter-spacing:.06em; text-transform:uppercase;
       display:inline-flex; align-items:center; gap:5px;
       padding:4px 8px; border-radius:999px; border:1px solid currentColor }
.sev-high { color: var(--high) }
.sev-med  { color: var(--muted) }
.sev-med .glyph::before { content:"\25A1" }  /* hollow square */
```

Three more places colour is doing work on this page and must not do it alone.

- **The terminal output block.** Real CLI output with red and green in it. Keep
  the colours and keep the leading glyph or word the CLI itself prints, so the
  status is readable in monochrome. Do not recolour the raw output to look
  prettier than the tool. If the CLI prints a bare coloured token with no
  symbol, that is a CLI bug worth fixing in the CLI, not papering over here.
- **The pricing cards.** If one card is marked as recommended, the mark is a
  text label ("Recommended"), never just an accent border. A card distinguished
  only by an accent outline fails 1.4.1.
- **Links in prose.** Underline them. An accent-coloured link with no underline
  inside a paragraph is the textbook 1.4.1 failure. `text-decoration:
  underline; text-underline-offset: 2px;` and keep the underline on hover.

### 1.7 prefers-contrast and forced-colors

Two questions, two different answers. Both media features are Baseline widely
available, so support is not the deciding factor: `prefers-contrast` since May
2022, `forced-colors` since September 2022.

**`prefers-contrast`: no. Skip it.** Not a maybe.

The palette already clears 4.5:1 on every text pair in both modes, verified by a
script that exits 1. `prefers-contrast: more` exists so a page whose text sits at
4.6:1 can push itself higher. Ours is not that page. The honest options under
`more` would be to push `muted` and `faint` toward `ink`, which flattens a
hierarchy that was designed on purpose and buys a user who already has enough
contrast slightly more of it. Worse, `prefers-contrast: custom` matches users in
forced-colors mode, so a `prefers-contrast` block written carelessly starts
fighting the forced palette. That is a real bug for a real user, traded for a
cosmetic gain for a user who has none.

The one thing worth doing is not a `prefers-contrast` rule at all: make sure
`line`, at #E4E1DB and #262A30, is never the only thing separating two regions.
Every card also has a background step (`card` or `raised` against `bg`), so the
structure survives if a border becomes invisible. That helps low-vision users
under every setting rather than only under one media query.

**`forced-colors`: yes. Handle it, in about fifteen lines.** Also not a maybe.

This page is a developer tool aimed partly at Windows users and Windows High
Contrast mode is the one setting that will break specific things here in ways the
user cannot work around. Three concrete breakages, all confirmed by what the
spec forces:

1. **`box-shadow` is forced to `none`.** The sticky bar's shadow and the cards'
   soft elevation vanish, so the bar stops being visually separated from the
   content scrolling under it.
2. **`background-image` is forced to `none` for non-url values.** Any gradient
   used for a hero wash or a button surface disappears.
3. **Severity colour is forced to `CanvasText`**, so `high` and `medium` become
   the same colour. The word and the glyph from 1.6 are what save this. That is
   the second reason the shape channel exists.

The rules:

```css
@media (forced-colors: active) {
  /* Restore the boundaries the mode removed. */
  .bar, .card, .price, .findings, pre { border: 1px solid CanvasText; }

  /* Shadows are gone, so the sticky bar needs a real bottom edge. */
  header { border-bottom: 1px solid CanvasText; }

  /* Focus must not be the same colour as the border. */
  :where(a, button, input, [tabindex]):focus-visible { outline: 3px solid Highlight; }

  /* The checked theme radio was distinguished by background. Add a mark. */
  .themeset input:checked + label { border: 2px solid Highlight; }

  /* Severity keeps its shape channel; the hue is gone either way. */
  .sev { border: 1px solid CanvasText; }
}
```

Rules for writing more of these, from the spec's own guidance:

- Only use system colour keywords inside this block. A hex value in
  forced-colors mode is either ignored on a forced property or clashes on a
  property that is not forced.
- Do not build a separate design here. The mode is meant to be readable by
  default. These rules only restore separations that the mode removed.
- Never use `forced-color-adjust: none` to keep the brand palette. That opts the
  user out of the setting they chose. The only legitimate use is a colour swatch
  whose colour is the content and this page has none.
- The mode sets `prefers-color-scheme` from the lightness of `Canvas`, so the
  page's own dark tokens may already be active underneath. Do not assume light.

### 1.8 The injected region, session state and the copy control

The findings and licence area changes without a page load, which puts it under
SC 4.1.3 Status Messages, Level AA: a change telling the user the result of an
action, the waiting state or the existence of an error has to be programmatically
determinable so assistive tech can announce it without taking focus.

- The `<section>` wrapper carries `role="status"` and `aria-live="polite"`. Use
  `polite`, not `assertive`. Nothing on this page is time critical and the
  criterion's own failure list names overuse of `assertive` as a failure.
- Add `aria-atomic="true"` so a rewritten summary line is announced whole
  ("3 findings, 2 high") rather than as a changed number.
- One short summary sentence is injected first, before the finding cards. Long
  bodies read aloud in full are worse than a headline. Screen reader users can
  then navigate the `h3`s.
- The signed-in identity in the sticky bar ("checking session…" then the email)
  is also a status message. Wrap it in `role="status"`. It updates once on load,
  so the announcement is cheap.
- Errors get `role="alert"`, which is the one place assertive is right. A failed
  checkout or a 401 must not sit silently on screen.
- If the minted licence ships a copy button, the confirmation is text, not just a
  colour change on the button. `role="status"` on a small "Copied" span next to
  it, cleared after a few seconds. Never put the confirmation only in the
  button's own label, because a label that mutates under the user's cursor is
  confusing and it re-announces the whole button.

The one form field on the page, the repo path input, needs a real `<label>`.
`placeholder` is not a label: it disappears on input, it is not reliably exposed
and its contrast is usually too low. Visible label above the field, `for` and
`id` paired, placeholder kept as an example only.

```html
<label for="target">Path to a git repo</label>
<input id="target" name="target" spellcheck="false" autocapitalize="off"
       autocorrect="off" inputmode="text" placeholder="/absolute/path/to/a/git/repo">
```

`autocapitalize="off"` and `autocorrect="off"` matter on iOS, where the keyboard
will otherwise capitalise a path and autocorrect a directory name. That is a
usability fix and an accessibility one: a user who cannot easily retype a long
path should not have to.

The install command in the hero is not an input. It is a `<code>` inside a
`<pre>`, with a copy button beside it. Give the button a real accessible name
("Copy install command"), not "Copy". Mark the icon `aria-hidden`.

### 1.9 The checklist

Tick these by hand. Target is WCAG 2.2 AA. Every line is checkable in a browser
in under a minute and none of them needs a paid tool.

**Structure**

- [ ] Exactly one `<h1>` and it is the hero headline.
- [ ] No heading level skipped, top to bottom. Check with the browser's
      accessibility tree or a headings bookmarklet, not by reading the source.
- [ ] `<header>` and `<footer>` are direct children of `<body>`.
- [ ] Exactly one `<main>` and the skip link's `href` matches its `id`.
- [ ] The second `<nav>` has an `aria-label`.
- [ ] `<html lang="en">` present.
- [ ] Page `<title>` names the product and what it does.
- [ ] The `Your findings` heading is in the static HTML, present when empty.

**Keyboard**

- [ ] Tab through the whole page. Every control is reachable and every stop is
      visible. No stop is invisible or off-screen.
- [ ] The skip link is the first stop and it lands focus in `<main>`.
- [ ] Focused controls are not hidden under the sticky bar. Check with
      `scroll-margin-top` applied (2.2).
- [ ] Arrow keys move between the three theme radios. Tab enters and leaves the
      group as one stop.
- [ ] Focus ring visible on every control in light mode.
- [ ] Focus ring visible on every control in dark mode.
- [ ] No `tabindex` above 0 anywhere.
- [ ] Nothing traps focus.

**Colour and contrast**

- [ ] The contrast script exits 0 in both modes.
- [ ] `ink` on `raised` measured (checked theme label).
- [ ] `control-border` on `raised` measured, needs 3:1 for non-text.
- [ ] Every severity badge prints the word "high" or "medium".
- [ ] Filled versus hollow glyph differs between high and medium.
- [ ] Page screenshotted in greyscale and severity is still readable.
- [ ] Links inside paragraphs are underlined.
- [ ] Any recommended pricing card carries a text label.

**Targets and forms**

- [ ] Every button, theme label and bar control is at least 44px in both axes.
      Measure in devtools, not by eye.
- [ ] Nothing interactive is under 24px, which is the SC 2.5.8 floor.
- [ ] The repo path input has a visible `<label>` with a matching `for`.
- [ ] The copy button's name says what it copies.
- [ ] Disabled controls are not the only way to communicate why they are
      disabled. There is text.

**Live regions**

- [ ] Findings region is `role="status" aria-live="polite" aria-atomic="true"`.
- [ ] A summary sentence is injected first.
- [ ] Errors use `role="alert"`.
- [ ] Session state in the bar is a status region.
- [ ] Nothing on the page is `aria-live="assertive"` except errors.

**Modes and settings**

- [ ] OS set to dark, page loads dark, no flash of light on first paint.
- [ ] OS set to light, page loads light.
- [ ] Choose Dark, reload, still dark. Choose System, reload, follows the OS.
- [ ] Flip the OS theme with System selected and the page follows live.
- [ ] Windows High Contrast on (or Chrome devtools Rendering, emulate
      `forced-colors: active`): the sticky bar has a visible bottom edge, cards
      have borders, focus is visible, severity is still distinguishable.
- [ ] No `forced-color-adjust: none` anywhere in the file.
- [ ] Reduced motion is the other agent's checklist item, not this one.

**Reflow**

- [ ] 320px wide viewport: no horizontal page scrollbar. SC 1.4.10 Reflow, AA,
      is the criterion and 320 CSS px is the number.
- [ ] 1280px viewport at 400% zoom: same result, since that is the same 320px.
- [ ] Text at 200% zoom does not clip or overlap.
- [ ] The terminal block and the install command scroll inside themselves, and
      the paragraph next to them still reflows.
- [ ] Any table is inside its own scroll container, so only the table scrolls.

## Part 2. Responsive plan

### 2.1 The breakpoints

Four states, mobile first, `min-width` only. No `max-width` queries anywhere, so
every rule adds and none undoes.

| Query | Range | Name | What changes |
| --- | --- | --- | --- |
| none | 320 to 559 | phone | single column, 16 to 20px gutter, 56px bar, full-width primary button, 30px h1 |
| `min-width: 560px` | 560 to 759 | large phone | 24px gutter, prose capped at 62ch, section spacing to 56px, buttons back to auto width |
| `min-width: 760px` | 760 to 1023 | tablet | pricing goes two across, check list gains its meta column, section spacing 72px, h1 38px |
| `min-width: 1024px` | 1024 up | desktop | container settles at 880px, 64px bar, section spacing 96px, h1 48px, 32px gutter |

Design target is 360px, which is the narrowest phone anyone will really hold.
The verified floor is 320px, because SC 1.4.10 Reflow, Level AA, is measured at
320 CSS px wide with no scrolling in two dimensions and 320px is also what a
1280px viewport becomes at 400% zoom. Those are the same test, so passing at 320
covers both.

Why these four numbers and not a longer ladder:

- **560** is where a phone stops being narrow. Below it, controls that sit side
  by side start pushing each other. Above it a two-item row is comfortable.
- **760** is set by the pricing cards, not by a device. Two cards want 340px of
  content each. 760 minus 24px gutters minus a 20px gap leaves 346 each. That is
  the first width where two across is not cramped.
- **1024** is where the container stops growing, so nothing past it needs a
  query.

Nothing is keyed to a device name and there is no 480 or 640 tier, because on
this page nothing changes at those widths. A breakpoint that changes nothing is
a maintenance cost.

`rem` for type and spacing, `px` for the queries. Media queries in `em` respond
to the user's browser font size, which sounds better than it is: it moves the
breakpoints under someone who has set a 20px default and the layout was tuned
against the viewport, not the font. Keep the queries in px and let the type scale
in rem handle text size.

The container and gutters as one rule, so the page has a single source of width:

```css
:root { --gutter: 1.25rem; --max: 880px; }
@media (min-width: 560px)  { :root { --gutter: 1.5rem } }
@media (min-width: 1024px) { :root { --gutter: 2rem } }

.wrap {
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
  padding-inline: max(var(--gutter), env(safe-area-inset-left),
                                    env(safe-area-inset-right));
}
```

`max()` with both insets in one call is slightly wrong on a device where left and
right insets differ, which happens in landscape. If landscape matters, split it
into `padding-left` and `padding-right`. On this page it does not, because the
content is centred and the difference is a few pixels of gutter.

### 2.2 The sticky bar on a small screen

**The session controls collapse. The brand never does.** Do not hide the brand
behind a hamburger and do not build a hamburger at all.

The bar has four things competing for 360px: the brand, the theme control, the
session buttons and the safe-area inset. Here is the budget at 360px, gutters
included:

```
360 total
 -32  gutters (16 each)
 328 usable
  -92 brand wordmark
  -88 theme control, icon only, three 44px labels overlapping at 28px visual
 -148 remaining for one session button
```

One session button fits. Two do not. That is the whole design constraint and it
resolves cleanly because **only one session button is ever visible at a time.**
The existing markup already has all four `hidden` and reveals by state:

| State | Visible control |
| --- | --- |
| signed out | Sign in |
| signed in, no licence | Get my licence |
| signed in, licensed | Sign out |

So the bar is never actually crowded. The rules that make it hold:

```css
header {
  position: sticky; top: 0; z-index: 10;
  background: var(--card);
  border-bottom: 1px solid var(--line);
  padding-top: env(safe-area-inset-top);   /* 0 everywhere it does not apply */
}
.bar {
  display: flex; align-items: center; gap: .5rem;
  min-height: 56px;                        /* 64px at >=1024 */
}
.brand { margin-right: auto; font-weight: 650; letter-spacing: -.01em }

/* Phone: the theme control loses its words, keeps its targets. */
.themeset .lbl { position:absolute; width:1px; height:1px; overflow:hidden;
                 clip-path: inset(50%); white-space:nowrap }
@media (min-width: 760px) { .themeset .lbl { position:static; width:auto;
                 height:auto; clip-path:none } }
```

Hiding the word "System" while keeping the icon means the icon-only control now
needs its own accessible name. The `<span class="lbl">` is still in the DOM and
still clipped rather than removed, so the label keeps naming the input. That is
the reason for the clip pattern rather than `display:none`, again.

Three more things about this bar, each of which is a bug if skipped.

- **The session slot needs a fixed minimum or the bar reflows on load.** The
  text goes from "checking session…" to a button, which changes width and shifts
  the brand. Give the slot `min-width: 8rem` on phone so the swap is silent. On a
  page that opens with a status message, a visible jump reads as a bug.
- **The email address must truncate, never wrap.** Wrapping doubles the bar
  height mid-session and pushes the hero down.
  `.who { max-width: 40vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }`
  and drop it entirely below 560px, where the visible button already says what
  the state is. A truncated email is not information, so losing it costs nothing.
- **Anchors must clear the bar.** A sticky header hides whatever a fragment link
  scrolls to. One line fixes it for the whole page:
  `:target, h2, h3 { scroll-margin-top: calc(56px + 1rem) }` and 64px at desktop.
  This is also the fix for the keyboard checklist item about focus landing under
  the bar.

Skip link, which has to sit above the sticky bar:

```css
.skip { position:absolute; left:.5rem; top:.5rem; z-index:20;
        transform: translateY(-200%);
        background: var(--card); color: var(--ink);
        border:1px solid var(--control-border); border-radius:6px;
        padding:.6rem .9rem }
.skip:focus-visible { transform: none }
```

The bar height is 56px on phone and 64px from 1024, which are both comfortably
over the 44px target minimum with padding to spare.

### 2.3 Pricing, two across to one

Two tiers only, so there is no grid to manage. `flex-wrap` with a basis is
enough and it needs no media query at all:

```css
.prices { display:flex; flex-wrap:wrap; gap:1.25rem }
.price  { flex: 1 1 340px }     /* wraps below ~740px on its own */
```

That is the whole mechanism. Two 340px cards plus a 20px gap need 700px of
content width, which the container gives at about 748px of viewport, so the wrap
happens just under the 760 breakpoint by itself. The breakpoint at 760 then only
tunes spacing, not the arrangement. Intrinsic wrapping beats a query here because
the cards wrap correctly inside any container, including at 400% zoom where the
viewport width no longer predicts the content width.

Ordering matters when they stack. Free goes first on phone, because the honest
sequence is "here is the free thing, here is what the paid one adds" and a
visitor who stops reading after one card should have read the free one. In DOM
order that means Free then Watch. Do not use `order` to flip them at desktop.
Visual order diverging from DOM order breaks tab order and screen reader order
and there is no reason to want it here.

At desktop the two cards must be equal height, which flex gives by default with
`align-items: stretch`. Push the price and the button to the bottom of each card
so they line up across both:

```css
.price { display:flex; flex-direction:column }
.price .cta { margin-top:auto }
```

### 2.4 The two things that overflow 360px

Both are monospace and both are content, so neither may be shrunk to fit or
truncated. `npx margyn /path/to/repo` is 27 characters. The terminal block is
much wider.

#### The install command

At 13px monospace, one character is about 7.8px, so 27 characters is roughly
211px plus padding. It fits at 360px. It does **not** fit at 320px with a copy
button beside it and it will not fit for a user at 200% text zoom. Three rules,
in order of preference.

1. **Never break the command across lines.** A wrapped shell command invites a
   copy that misses a segment and a mid-path break is unreadable. So
   `white-space: pre` on the command, not `pre-wrap`.
2. **Let its own box scroll.** `overflow-x: auto` on the `<pre>`. SC 1.4.10
   permits a scroll container for content that needs it, as long as the
   surrounding text still reflows, which it does.
3. **Put the copy button on its own line below 560px**, not beside the command.
   Side by side, the button eats the width the command needs. Stacked, the
   command gets the full container and the button gets a full-width 44px target,
   which is easier to hit anyway.

```css
.cmd { display:flex; flex-direction:column; gap:.5rem;
       background: var(--raised); border:1px solid var(--line);
       border-radius:8px; padding:.75rem }
.cmd pre { margin:0; overflow-x:auto; white-space:pre;
           font: 0.8125rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
           overscroll-behavior-x: contain }
@media (min-width: 560px) {
  .cmd { flex-direction:row; align-items:center; gap:.75rem }
  .cmd pre { flex:1 1 auto; min-width:0 }   /* min-width:0 or flex refuses to shrink */
}
```

`min-width: 0` on the scrolling child is the line people forget. A flex item's
default `min-width: auto` is its content size, so without it the `<pre>` refuses
to shrink and pushes the whole row wider than the viewport. That single
declaration is the difference between a page that reflows at 320px and one that
does not.

#### The terminal output block

This is the centrepiece of the page, so it gets real work rather than a scrollbar
and a shrug.

- **Horizontal scroll inside the block, always.** Real CLI output has meaningful
  column alignment and rewrapping it destroys the thing being shown. This is the
  "requires two-dimensional layout for usage or meaning" case that SC 1.4.10
  explicitly excepts, applied narrowly to the block and not to the page.
- **The block is a `<pre>` with `tabindex="0"`, `role="group"` and an
  `aria-label`** naming what it shows, for example "Margyn output for its own
  repository". Chrome made scrollers keyboard focusable by default from version
  130, but Safari has not, so `tabindex="0"` is still required for a keyboard
  user to scroll it. Expect axe's `scrollable-region-focusable` rule to demand it
  too.
- **Choose the viewport, do not inherit it.** Pick the crop deliberately: the
  narrowest column set that still tells the story, so at 360px the reader sees a
  complete thought and not the left half of one. If the real output is 100 columns
  wide, the phone shows a slice, so make the first 44 characters of each line the
  part that matters. That is an editing decision on the captured output, made once
  when the fixture is chosen. It is the single most useful thing in this
  document for how the phone layout feels.
- **Show that it scrolls.** A right-edge fade tells the reader there is more
  without a scrollbar hint that touch devices hide anyway. It has to be a
  gradient over the block's own background and it must be `aria-hidden`. Drop it
  in forced-colors mode, where `background-image` is forced to `none`.
- **Font size stays 13px and does not shrink below 560px.** Shrinking monospace
  to force a fit is the wrong trade: it makes the hero unreadable to save a
  scrollbar. Full-bleed is the better trade (below).
- `overscroll-behavior-x: contain` so a horizontal swipe inside the block does not
  trigger the browser's back gesture.

Full-bleed on phone, which is the deliberate move. Below 560px the terminal block
breaks out of the gutter and spans the whole viewport, so it buys 32px of column
width back and it reads as a real console rather than a card:

```css
.term {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  background: var(--raised); border-block: 1px solid var(--line);
  /* break out of the container's gutter */
  margin-inline: calc(var(--gutter) * -1);
  padding: 1rem var(--gutter);
}
@media (min-width: 560px) {
  .term { margin-inline: 0; border:1px solid var(--line); border-radius:10px }
}
.term pre { margin:0; white-space:pre; min-width:0 }
```

The `padding-inline: var(--gutter)` inside the full-bleed block is what keeps the
first character off the screen edge while the block itself touches both edges.
Without it the text starts at x=0 and looks broken.

### 2.5 Tables

The page has one table at most, in the five-checks section if it is presented as
a matrix of check, severity and what it finds. **Do not use a table there.** Five
items with a name, a severity and two sentences of prose are a description list
or a set of cards. A table forces a fixed column count on a 360px screen and it
gives no benefit, because nobody is comparing values down a column.

Use a definition-style block instead:

```html
<div class="check">
  <h3><code>ignored-source</code> <span class="sev sev-high">…</span></h3>
  <p>Files the repo reads that git never committed.</p>
</div>
```

On phone the severity badge sits under the check name. From 760px it moves to the
right of it, which is the "gains its meta column" change in the breakpoint table:

```css
.check h3 { display:flex; flex-direction:column; align-items:flex-start; gap:.35rem }
@media (min-width: 760px) {
  .check h3 { flex-direction:row; align-items:baseline; gap:.6rem }
}
```

If a real table is unavoidable later, the rule is: wrap it in
`<div role="region" aria-label="…" tabindex="0" style="overflow-x:auto">`, never
convert `<tr>` to `display:block` with `::before` pseudo-element labels. That
trick destroys the table semantics in several screen readers and SC 1.4.10
excepts data tables from reflow anyway, so scrolling one is compliant. Keep the
table a table and scroll it.

### 2.6 Safe-area insets and viewport units

**Safe-area insets: yes, in exactly three places.** They need
`viewport-fit=cover` in the viewport meta or every `env()` resolves to `0px` and
the CSS looks correct while doing nothing.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

1. `padding-top: env(safe-area-inset-top)` on the sticky `<header>`, so the bar
   sits below the notch or the Dynamic Island rather than under it.
2. The horizontal gutter, folded into the `max()` in 2.1, which matters in
   landscape where the inset is on the side.
3. `padding-bottom: max(2rem, env(safe-area-inset-bottom))` on the `<footer>`, so
   the last link is not under the home indicator.

`env()` has been Baseline widely available since January 2020 and it resolves to
`0px` on every device with no cutout and on every desktop browser, so the pattern
ships unconditionally with no feature query. Always wrap it in `max()` against a
real minimum, because `0px` of gutter is not a design.

**`100dvh`: no. Nowhere on this page.** A concrete no, not a hedge.

This page is a long scrolling document. Nothing on it is a full-height pane,
there is no hero that must fill the screen and there is no app shell. The only
plausible use would be a hero sized to the viewport and that is the wrong shape
here: the whole point of the hero is that the terminal output starts before the
fold, so a reader sees evidence without scrolling. A viewport-height hero would
push it below.

Two more reasons to leave it out. `dvh` changes as mobile browser chrome
retracts, which resizes content while the user scrolls and MDN flags that as a
UI and performance cost. And `min-height: 100vh` on `<body>` is not needed
either, because the content is always taller than the viewport. If a
short-content state ever appears (an error page or a signed-out state with one
line), use `min-height: 100svh` on the wrapper so the footer sits at the bottom.
`svh` is the small viewport, which is stable and does not resize during scroll.
`dvh` would still be the wrong unit even then.

### 2.7 The type scale and one iOS trap

Type steps at the breakpoints rather than sliding, so every width was actually
looked at. `clamp()` is fine for the `h1` alone, where the exact size at
intermediate widths does not matter:

| Element | phone | 560 | 760 | 1024 |
| --- | --- | --- | --- | --- |
| h1 | 30px | 34px | 38px | 48px |
| tagline | 17px | 18px | 19px | 20px |
| body | 16px | 16px | 16px | 16px |
| h2 | 22px | 23px | 24px | 26px |
| mono | 13px | 13px | 13px | 13px |
| bar controls | 14px | 14px | 14px | 14px |

Body stays 16px at every width. Do not drop it to 15px on phone. Small text on a
small screen is the exact combination that fails a low-vision user.

**The iOS trap: the repo path input must be at least 16px.** iOS Safari zooms the
whole page when a focused form control computes under 16px. The zoom does not
undo cleanly, so the user is left on a page wider than the screen. The current
build sets the input to 14px monospace, which will trigger it. Fix it on the
input, not with `maximum-scale=1` on the viewport meta, because that disables
pinch zoom for everyone and is an accessibility failure in itself.

```css
input, select, textarea { font-size: 1rem }   /* 16px, non-negotiable on iOS */
```

The `h1` also needs `text-wrap: balance` so the headline does not leave one word
alone on the last line. Baseline newly available since October 2024. The
failure mode is a slightly worse line break, so no fallback is needed. It only
applies to blocks of six lines or fewer in Chromium and ten or fewer in Firefox,
which covers a headline. Use `text-wrap: pretty` on body prose only if you check
it, since it landed later than `balance` and differs between engines.

### 2.8 What makes the phone layout deliberate rather than stacked

Stacked means every block became full width in DOM order and the desktop
decisions were left in place. Nine things here are decided for the phone
specifically and each one is visible:

1. **The terminal block goes full bleed.** It stops being a card and becomes the
   console, edge to edge, which is both wider and more confident. That is the
   opposite of what stacking does to it.
2. **The output crop was chosen for 360px.** The first 44 characters of every
   line are the part that carries the finding. A stacked layout shows whatever the
   left edge happened to be.
3. **The theme control drops its words and keeps its 44px targets.** Three icons,
   no wrap, no menu and the labels are still there for a screen reader.
4. **Only one session button exists at a time**, which is why the bar needs no
   hamburger. That was already true of the state machine and the phone layout is
   what makes it pay off.
5. **The email truncates, then disappears under 560px**, because the visible
   button already tells the user which state they are in.
6. **The copy button moves below the command instead of beside it**, giving the
   command the whole width and the button a full-width target.
7. **Free is first when the cards stack**, so the reader who stops after one card
   read the right one. That is an ordering decision, not a fallout.
8. **The session slot reserves its width**, so the bar does not jump when the
   session resolves.
9. **Safe-area insets are honoured top, sides and bottom**, so the bar clears the
   Dynamic Island and the footer clears the home indicator.

The other half of deliberate is what does not change: 16px body text, 13px
monospace, 44px targets and the full palette. Nothing is shrunk to make it fit.
Every fit problem on this page is solved by giving the content more width or its
own scroll container, never by making it smaller.

## Sources

Read on 2026-08-05.

- WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA, 24 by 24 CSS px:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG SC 2.5.5 Target Size (Enhanced), Level AAA, 44 by 44 CSS px, from WCAG
  2.1 and renamed in 2.2:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- SC 1.4.1 Use of Color, Level A:
  https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- SC 1.4.10 Reflow, Level AA, 320 CSS px and the 1280 at 400% equivalence, plus
  the two-dimensional-layout exception:
  https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- SC 4.1.3 Status Messages, Level AA, plus the note that assertive overuse is a
  listed failure: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- `forced-colors`: the two values, the forced property list including
  `box-shadow` to `none`, the `prefers-color-scheme` derivation from `Canvas`
  and Baseline widely available since September 2022:
  https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
- `prefers-contrast`: the four values, `custom` matching forced-colors users, and
  Baseline widely available since May 2022:
  https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast
- `env()` and `safe-area-inset-*`: Baseline widely available since January 2020,
  the `viewport-fit=cover` dependency and the `0px` fallback behaviour:
  https://developer.mozilla.org/en-US/docs/Web/CSS/env
- Dynamic viewport units and the note that `dvh` can resize content during
  scroll: https://developer.mozilla.org/en-US/docs/Web/CSS/length
- `text-wrap-style`: Baseline newly available October 2024 and the six or ten
  line limit on `balance`:
  https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap-style
- Keyboard focusable scrollers, default from Chrome 130, which is why Safari
  still needs `tabindex="0"` on a scrolling `<pre>`:
  https://developer.chrome.com/blog/keyboard-focusable-scrollers
- axe rule `scrollable-region-focusable`, the checker that will flag it:
  https://dequeuniversity.com/rules/axe-devtools/4.6/scrollable-region-focusable
- The web.dev theme switch component, the `aria-label` plus `aria-live` pattern
  this document rejects in favour of a radio group:
  https://web.dev/articles/building/a-theme-switch-component
- iOS Safari focus zoom under 16px on form controls:
  https://guidefari.com/safari-ios-input-zoom/

## Two things for the build to settle

1. Run the contrast script on `ink` on `raised` and on `control-border` on
   `raised`. Both are introduced by the theme toggle's checked state and neither
   is in the verified set. The border pair is the risk, since 3.38:1 against `bg`
   leaves almost nothing over the 3:1 non-text floor once the surface changes.
2. The current `web/public/index.html` has three things this document changes:
   the input is 14px and will trigger iOS focus zoom, the finding card carries
   severity in a left border colour alone and there is no `<header>`, `<footer>`,
   heading structure below `h1` or theme control yet. None of that is a surprise.
   It is a scaffold and this is the plan for the real page.

