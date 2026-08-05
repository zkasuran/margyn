# Design references for margyn.xyz

Measured 2026-08-05. Twenty dev-tool homepages fetched live, then measured in a
real headless Chrome at 1440x1000, once with `prefers-color-scheme: light` and
once with dark. Every number below is a computed style read off the live page, not
a guess from a screenshot and not a value copied out of a design-system blog post.
Where a site has no light mode or no dark mode, that is recorded as a finding
rather than filled in.

How to read the numbers:

- **max-width** is the widest recurring constrained container on the page, taken
  from computed `max-width` on real content wrappers, with the count of elements
  sharing it. A site often has two: an outer page width and an inner prose width.
- **type scale** is measured on the actual h1, h2, body paragraph and the most
  common small size, in that order, with line height after the slash.
- **section rhythm** is the computed vertical padding on the repeating section
  wrappers, so `128/128` means 256px of air between two blocks of content.
- **radius census** counts every visible element (width and height over 8px) that
  carries a non-zero radius, so the top entry is the value that actually sets the
  page's feel.
- **borders vs shadows** counts visible elements carrying a border against visible
  elements carrying a box-shadow, over the same element set. The ratio is the
  interesting part.

The palette is locked, so nothing below proposes a colour. Backgrounds are
recorded only to answer one question: does the premium tier use pure white and
pure black.

## Linear

`https://linear.app/`

Dark only. There is no light mode and the page ignores `prefers-color-scheme`.

| Property | Measured |
| --- | --- |
| Content max-width | 1436px outer (10 wrappers), 560px and 512px for prose blocks |
| Base font / line height | 16px / 24px (1.5), Inter Variable |
| h1 | 64px / 64px, weight 510, letter-spacing -1.408px (-0.022em) |
| h2 | 48px / 48px, weight 510, letter-spacing -1.056px (-0.022em) |
| h3 | 20px / 26.6px, weight 590, letter-spacing -0.24px |
| Body copy | 15px / 24px (1.6) is the workhorse, not 16px |
| Small | 14px is the most used size on the page (318 elements), then 13px and 12px |
| Section rhythm | 128px top and bottom, so 256px between sections. Section pitch measured on the live page runs 1180 to 1240px per band |
| Radius census | 2px (46), 6px (40), 4px (30), 12px (23), pill 9999px (18), 8px (12) |
| Borders vs shadows | 85 borders, all `1px solid`, against 71 shadows. Borders lead |
| Light background | none |
| Dark background | `#08090A`, text `#F7F8F8` |

Homepage order: hero headline and product claim, a single feature callout, then
six numbered capability sections each with its own h2 and a large product visual,
a changelog block, a closing "Built for the future. Available today." call to
action, then a five-column footer.

What makes it feel premium: the tight optical letter-spacing at display size
(-0.022em on both h1 and h2, scaled with the size rather than fixed), a 510 font
weight rather than 600 or 700, line height locked to exactly 1.0 at 64px and 48px,
and the smallest radius set on the page. The heaviest shadow on the whole page is
`rgba(0,0,0,0.03) 0 1.2px 0`, a hairline, not a drop shadow.

## Vercel

`https://vercel.com/`

| Property | Measured |
| --- | --- |
| Content max-width | 1080px is the design token (`--max-width: 1080px`), 1200px is `--geist-page-width`, 1400px is `--ds-page-width`. Prose caps at 600px, 640px and 401px for card copy |
| Base font / line height | 16px / 24px (1.5), Geist Sans |
| h1 | 64px / 64px, weight 400, letter-spacing -3.84px (-0.06em) |
| h2 | 56px / 56px, weight 450, letter-spacing -3.36px (-0.06em) |
| h3 | 14px / 20px, weight 500, letter-spacing normal. Section labels, not headings |
| Body copy | 16px / 24px in cards, 24px / 32px for the lead paragraph under each h2 |
| Small | 14px dominates (230 elements), then 16px (129), 20px (67), 18px (35) |
| Section rhythm | no padding on the section wrappers. Rhythm comes from the section pitch itself: 1208, 2081, 2953, 3779, measured tops, so roughly 870px per band |
| Radius census | 6px (46 elements) then pill, then 8px. `--geist-radius: 6px` and `--geist-marketing-radius: 8px` are the two published tokens |
| Borders vs shadows | zero visible 1px borders, 14 shadows. The workhorse shadow is a ring: `rgba(0,0,0,0.08) 0 0 0 1px, rgba(0,0,0,0.04) ...`. They draw borders as inset rings so they compose with radius |
| Light background | `#FAFAFA`, text `#171717`. Not pure white |
| Dark background | `#0A0A0A` |

Homepage order: nav with three grouped menus, hero (`Agentic Infrastructure`, one
line, 64px), three product story sections each with h2 plus a 24px lead plus a
visual, a "Recently shipped" changelog strip, a closing "Built by you, or your
agents" call to action, then a six-column footer.

What makes it feel premium: -0.06em on display type, which is aggressive and only
works because Geist is designed for it. Weight 400 at 64px. One idea per section.
The 1px "border" is a `0 0 0 1px` shadow, so it never fights the radius and never
adds layout width.

## Resend

`https://resend.com/`

Dark only. Serves `#000000` on the body and `transparent` on html, in both schemes.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px outer (11 wrappers), 1024px and 768px inner. Prose caps at 480px and 512px |
| Base font / line height | 16px / 24px, Inter |
| h1 | 96px / 96px, weight 400, letter-spacing -0.96px (-0.01em) |
| h2 | 56px / 67.2px (1.2), weight 400, letter-spacing -2.8px (-0.05em) |
| h3 | 20px / 26px, weight 400 |
| Body copy | 18px / 27px (1.5) is the standard, capped at 480 to 512px |
| Small | 12px is the most common size on the page (670 elements), then 14px (375) |
| Section rhythm | `96px/96px`, nine sections share it exactly. 192px between blocks |
| Radius census | pill (174) then 16px (72), 6px (33), 8px (31), 24px (10) |
| Borders vs shadows | 213 borders (170 at 1px) against 10 shadows. Borders win 21 to 1 |
| Light background | none |
| Dark background | `#000000`, text `#F0F0F0` |

Homepage order: hero at 96px with a product visual, Integrate (code sample),
first-class developer experience, test mode plus modular webhooks as a pair, the
editor, contact management plus broadcast analytics as a pair, React email,
deliverability, control, then "Email reimagined. Available today."

What makes it feel premium: a 96px h1 with line height exactly 1.0, a 12px caption
tier used heavily and confidently, plus near-total absence of shadow. Separation is
a 1px border and nothing else. The 96px section padding never varies.

## PlanetScale

`https://planetscale.com/`

The most extreme page in the set and the closest reference for a CLI-first tool.
The entire homepage is set in a monospace face at one size.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px. One container, nothing else |
| Base font / line height | 16px / 24px, `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas` |
| h1 | 16px / 24px, weight 700. Same size as body |
| h2 | 16px / 24px, weight 700. Same size as body |
| h3 | 16px / 24px, weight 700 |
| Body copy | 16px / 24px |
| Small | there is no small. Every one of 217 measured inline elements is 16px |
| Section rhythm | no section padding at all. The rhythm is the 24px line grid and section breaks are marked by a rule or a gap in that grid |
| Radius census | one pill on the page. Everything else is 0px |
| Borders vs shadows | 52 borders, all 1px solid. Zero shadows on the entire page |
| Light background | `#FAFAFA` on html, text `#414141`. Not pure white |
| Dark background | `#111111`, text `#E1E1E1`. Not pure black |

Homepage order: h1 claim, a long benchmark table, Performance, Uptime, Cost,
Security, Features (three feature lists side by side), then a text footer.

What makes it feel premium: total commitment. One typeface, one size, one weight
change, one radius, zero shadows, everything on a 24px baseline grid. It reads as
a terminal document rather than a marketing page, which is exactly the register a
CLI audit tool wants. It also proves the point that hierarchy can come from weight
and position alone, with no type scale at all.

## Tailscale

`https://tailscale.com/`

No dark mode. Serves `#F9F7F6` under both schemes.

| Property | Measured |
| --- | --- |
| Content max-width | 1440px, six wrappers. Prose caps at 768px |
| Base font / line height | 16px / 24px, Inter |
| h1 | 64px / 70.4px (1.1), weight 500, letter-spacing -0.64px (-0.01em) |
| h2 | 64px / 70.4px, weight 500. h1 and h2 are the same size |
| h3 | 48px / 52.8px for feature titles, 20px / 24px for card titles |
| Body copy | 16px / 24px, lead paragraph 20px / 24px capped at 768px |
| Small | 16px dominates (304), then 14px (86), 12px (23) |
| Section rhythm | 64px is the base unit: `64/64`, `72/64`, `32/64`, `32/32`, `32/96` |
| Radius census | 16px (129 elements) then 8px (91), pill (28), 32px (2) |
| Borders vs shadows | 173 borders (all 1px) against 141 shadows. 127 elements paint pure `#FFFFFF` on the off-white page |
| Light background | `#F9F7F6`, text `#181717`. Warm off-white |
| Dark background | none |

Homepage order: hero, a 40,000-businesses proof band, identity-based access,
installation-takes-minutes triptych, developer quotes, integrations count, closing
call to action, four-column footer.

What makes it feel premium: cards are pure white on a warm off-white page, so the
card boundary is a value step and the 1px border only reinforces it. Nothing on the
page needs a heavy shadow because the two surfaces already differ. Radius is large
and consistent at 16px outer, 8px inner.

## Clerk

`https://clerk.com/`

Light only. Serves `#F7F7F8` under both schemes. The dark surfaces on the page are
screenshots of Clerk's own components, not a page theme.

| Property | Measured |
| --- | --- |
| Content max-width | 1264px, twelve wrappers. Published tokens are `--content-width: 43.5rem` (696px) for prose and `--content-width: 64rem` (1024px) for wide blocks |
| Base font / line height | 16px / 24px, Suisse with a separate `geistNumbers` face for figures |
| h1 | 64px / 72px (1.125), weight 700, letter-spacing -1.6px (-0.025em) |
| h2 | 13px / 24px, weight 500 for eyebrow labels. Section titles run 17px to 32px |
| h3 | 16px / 24px, weight 400 for feature list items |
| Body copy | 18px / 28px (1.56) capped at 672px, 15px / 24px inside cards |
| Small | 13px is the most common size (129 elements), then 16px (110), 12px (19), 11px (12) |
| Section rhythm | 128px top with 172px bottom, three sections share it. Also 192/128 and 112/384 |
| Radius census | pill (94) then 6px (70), 8px (21), 16px (12), 10px (9). Tokens run `--radius-xs: .125rem` through `--radius-4xl: 2rem` |
| Borders vs shadows | 182 shadows against 17 borders, so shadow-led. The workhorse is again a ring plus a lift: `rgba(0,0,0,0.06) 0 0 0 1px, rgba(0,0,0,0.08) ...`, plus `rgba(255,255,255,0.05) 0 1px 0 inset` for a top highlight |
| Light background | `#F7F7F8`, text `#000000`. Cool off-white with 64 elements painting pure white on top |
| Dark background | none |

Homepage order: hero with a live component demo, Clerk Components gallery, a
component walkthrough, user authentication with a long feature list, multi-tenancy,
then the footer.

What makes it feel premium: a separate typeface just for numerals, a 13px tier used
for eyebrows and metadata, plus one consistent elevation recipe applied everywhere
(1px ring shadow, soft lift, 1px white inset highlight on the top edge). The inset
highlight is the trick that reads as physical without reading as a 2013 gradient
button.

## Railway

`https://railway.com/`

Dark only, `#13111C`.

| Property | Measured |
| --- | --- |
| Content max-width | 1160px is the content wrapper (nine of them), 1696px for full-bleed bands. Prose caps at 544px, 550px, 600px, 620px |
| Base font / line height | 16px / 26px (1.625), Inter. Looser than the 1.5 everybody else uses |
| h1 | 54px / 60.48px (1.12), weight 500, letter-spacing -1.96px (-0.036em) |
| h2 | 36px / 48px (1.33), weight 400, letter-spacing -0.72px (-0.02em) |
| Body copy | 18px / 28.8px (1.6) |
| Small | 16px (55), then 14px (22) |
| Section rhythm | 96px top. Measured section pitch runs 760 to 1740px, so the bands are deliberately uneven |
| Radius census | 8px (22) then 6px (6), 16px (3) |
| Borders vs shadows | 9 borders against 6 shadows, over 2259 visible elements. Almost nothing is boxed. Separation is space |
| Light background | none |
| Dark background | `#13111C` page with `#0B0B0F` panels (217 elements). Neither is pure black |

Homepage order: hero, deploy anything, instant networking, grow big, observability,
workflow, a "Trusted by the best in business" band, a deploy counter, footer.

What makes it feel premium: a two-value dark palette (page `#13111C`, panel
`#0B0B0F`) doing all the separation work with 2259 visible elements and only nine
borders. Body line height at 1.625 rather than 1.5.

## Neon

`https://neon.com/`

Dark only, pure `#000000`.

| Property | Measured |
| --- | --- |
| Content max-width | 1600px for full bands, 960px for content (five wrappers), 672px for prose. Cards cap at 384px |
| Base font / line height | 16px / 24px, Inter |
| h1 | 68px / 76.5px (1.125), weight 400, letter-spacing -2.72px (-0.04em) |
| h2 | 48px / 54px (1.125), weight 400, letter-spacing -1.92px (-0.04em) |
| h3 | 16px / 24px, weight 500, letter-spacing -0.4px |
| Body copy | 16px / 24px capped at 384px in cards |
| Small | 16px (196) then 20px (145), 15px (47), 13px (32) |
| Section rhythm | 160px is the unit: `160/160`, `160/240`, `160/168` plus one `0/240` |
| Radius census | 4px on 62 elements and pill on 7. That is the whole census |
| Borders vs shadows | 11 borders, 6 shadows, 819 visible elements. Effectively neither |
| Light background | none |
| Dark background | `#000000`, panels `#18191B` |

Homepage order: hero, cloud primitives, autoscaling, instant branching (with a
three-item sub-grid), managed auth, no platform fees, a backers band with a
15,000,000 figure, closing call to action.

What makes it feel premium: 160px section padding, so 320px of air between bands,
paired with a 4px radius and no borders. Big type at weight 400 with -0.04em
tracking. The 20px size being second most common means the secondary tier is large,
not small.

## Turso

`https://turso.tech/`

Dark only, `#0D1318`.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px (eight wrappers), 1024px, 576px for prose |
| Base font / line height | 16px / `normal`, Inter. They never set a body line height, which is a defect: `normal` is browser-dependent |
| h1 | there is no h1. The hero is an h2 at 72px / 72px, weight 800, letter-spacing -1.8px (-0.025em) |
| h2 | 72px hero, 48px / 48px weight 600 for sections, 36px / 40px weight 700 for sub-sections |
| h3 | 48px / 48px for product names, 24px / 32px for cards |
| Body copy | 20px / 32px (1.6) for leads, 18px / 29.25px capped at 768px |
| Small | 16px (79), 14px (47), 12px (7) |
| Section rhythm | no computed section padding at all. Section tops sit at 271, 942, 2830, 3963, 5577 |
| Radius census | pill (31), 16px (15), 12px (20), 24px (1) |
| Borders vs shadows | 50 borders (49 at 1px), zero shadows |
| Light background | none |
| Dark background | `#0D1318`, panels `#293945` |

Homepage order: hero, why agents need a new database, a Turso vs Turso Cloud pair,
testimonial band, four use cases, SDK lists, community.

Premium markers here are weaker: weight 800 at 72px is heavier than the rest of the
field. No body line height is a real bug. The good part is zero shadows against
50 hairline borders.

## Sentry

`https://sentry.io/welcome/`

Dark only, `#1F1633`.

| Property | Measured |
| --- | --- |
| Content max-width | 949px (23 wrappers), 1152px for wide bands, 656px for prose. The narrowest primary column in the set |
| Base font / line height | 16px / 32px (2.0), Rubik. The loosest body in the set |
| h1 | 88px / 105.6px (1.2), weight 700, letter-spacing normal |
| h2 | 60px / 66px (1.1), weight 500 |
| h3 | 16px / 24px, weight 600 |
| Body copy | 30px / 36px for the lead (capped at 60% width), 16px / 24px otherwise, 14px / 20px in cards |
| Small | 16px overwhelmingly (1469 elements), then 14px (235), 12px (83) |
| Section rhythm | `0/128` on six sections plus `128/128` on two, so 128px is the unit and they zero the top when a band abuts |
| Radius census | 10px (40), 8px (20), 12px (9) |
| Borders vs shadows | 12 borders (ten of them 2px) against 6 shadows, over 2370 elements |
| Light background | none |
| Dark background | `#1F1633` page with `#150F23` panels (82 elements) |

Homepage order: hero, developer-first with a four-item feature row, everything is
connected, debugging needs context, a "Loved by developers worldwide" band, pricing
teaser, footer.

What makes it feel premium: the 949px column. A narrow measure plus 16px / 32px body
reads like an essay, not a landing page. Note they pay for that with an 88px h1, so
the contrast between display and body carries the hierarchy.

## Stripe

`https://stripe.com/`

Light only. No dark mode. Backgrounds resolved through a canvas because the page
sets them in oklab.

| Property | Measured |
| --- | --- |
| Content max-width | 1266px outer (11 wrappers), 856px and 817.78px for content columns, 752px and 648px for prose |
| Base font / line height | 16px / `normal`, `sohne-var`. Body line height is unset at the root and set per component |
| h1 | 48px / 55.2px (1.15), weight 300, letter-spacing -0.96px (-0.02em) |
| h2 | 56px / 57.68px (1.03) weight 300 for the big statement, 32px / 35.2px weight 300 for section titles |
| h3 | 26px / 29.12px (1.12), weight 300, letter-spacing -0.26px (-0.01em) |
| Body copy | 32px / 35.2px for the lead, 16px for everything else |
| Small | 16px dominates (286), then 14px (41), 11px (20), 12px (11), 9px (4) |
| Section rhythm | `96/96` and `80/80` on the main bands, `36/36` on tighter strips |
| Radius census | 4px (53) then 6px (47), 5px (6), 8px (4). Small, on two adjacent values |
| Borders vs shadows | 42 borders (39 at 1px) against 8 shadows, but the shadows are the biggest in the set: `rgba(0,0,0,0.1) 0 20.19px 40.37px -20.19px` and `rgba(50,50,93,0.12) 0 16px 32px`, used only on the hero product card |
| Light background | page is transparent over white, with `#F8FAFD` and `#E5EDF5` bands as the recurring surfaces |
| Dark background | none |

Homepage order: hero with a product visual, flexible solutions (a six-item product
grid), the backbone of global commerce, businesses of all sizes with four named
customers, infrastructure for every stack, then a "What's happening" news row.

What makes it feel premium: weight 300 at every display size. Nobody else in the set
goes that light. A tiny 4px to 6px radius. Exactly one heavy shadow on the page, on
the one element that is meant to float and hairlines everywhere else. Nine-pixel
legal text exists and is used only for legal text.

## Supabase

`https://supabase.com/`

Both modes. The only site in the set with a genuine light and dark pair worth
copying. Backgrounds resolved through canvas (they ship oklab).

| Property | Measured |
| --- | --- |
| Content max-width | 1280px (13 wrappers), 512px for prose |
| Base font / line height | 16px / 24px, Inter |
| h1 | 46px / 46px (1.0), weight 500, letter-spacing normal. Notably small for a hero |
| h2 | 16px / 24px, weight 600 for product labels. Section titles are h3 at 34px / 37.78px (1.11), weight 600 |
| Body copy | 16px / 24px, then 14px / 20px inside cards |
| Small | 16px (186) and 13px (177) almost tied, then 14px (37), 12px (21) |
| Section rhythm | `96/96` on four sections, `40/40` on strips, one `160/64` for the hero |
| Radius census | 8px (74) then pill (52), 4px (27), 16px (16), 6px (15), 12px (14) |
| Borders vs shadows | 122 borders (all 1px) against 17 shadows, over 3585 elements. Border-led, with the one shadow that matters being `rgba(255,255,255,0.12) 0 0 0 1px inset`, a dark-mode hairline done as an inset ring |
| Light background | `#FDFDFD` page with `#FFFFFF` cards, text `#030303` |
| Dark background | `#131413` page with `#181A19` cards, text `#EDEFEE` |

Homepage order: hero with a code sample, a seven-product grid, dashboard, framework
quickstarts, templates, customer stories, community, open source, closing call to
action.

What makes it feel premium: the light and dark pair is built the same way in both
modes. Page is one step off white or off black (`#FDFDFD` / `#131413`), cards are one
step further (`#FFFFFF` / `#181A19`), then a 1px border sits on top in both. The card
lifts in light mode and in dark mode with the same rule, no shadow swap. Note the
direction reverses: light-mode cards are lighter than the page, dark-mode cards are
also lighter than the page.

## Val Town

`https://val.town/`

Light only, pure `#FFFFFF`. The smallest DOM in the set at 253 visible elements.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px (five wrappers), 720px for prose |
| Base font / line height | 16px / 24px, IBM Plex Sans |
| h1 | 48px / 57.6px (1.2), weight 400, letter-spacing -1.2px (-0.025em) |
| h2 | 48px / 52.8px (1.1), weight 400, same tracking |
| Body copy | 18px / 28.8px (1.6) |
| Small | 14px (42), then 16px (16), 12px (4) |
| Section rhythm | `80/80`, so 160px between bands. Four sections in a 5016px page |
| Radius census | pill (17), 12px (10), 8px (7), 16px (1) |
| Borders vs shadows | 6 borders, 7 shadows, 253 elements. Effectively unstyled separation |
| Light background | `#FFFFFF` pure white |
| Dark background | none |

Homepage order: hero with a live editor, one positioning statement, a feature block,
call to action. Four bands total.

What makes it feel premium: brevity. Two headings on the whole page, 253 visible
elements, a 5016px document. It refuses to add sections. That is the single most
copyable thing here for a pre-launch product with nothing to boast about.

## Bun

`https://bun.sh/`

Dark only, `#14151A`.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px (11 wrappers), then 900, 800, 768, 700, 640 for inner blocks |
| Base font / line height | 16px / 24px, `system-ui` stack with no webfont |
| h1 | 53.33px / 53.33px (1.0), weight 800, letter-spacing normal |
| h2 | 48px / 48px weight 800 for sections, 72px / 72px weight 800 for the loudest band, 24px / 33px weight 500 for chart titles |
| h3 | 24px / 32px, weight 700 |
| Body copy | 20.8px / 31.2px (1.5) for the lead, 20px / 32.5px capped at 700px |
| Small | 14px is the page (1034 elements), then 16px (146), 18px (55) |
| Section rhythm | `150/150` on seven sections, `128/128` on four, `120/120` on one. 300px between the main bands |
| Radius census | pill (115), 8px (111), 4px (79), 6px (15) |
| Borders vs shadows | 100 borders (42 at 2px, 31 at 4px, 23 at 1px) against 13 shadows |
| Light background | none |
| Dark background | `#14151A` page, `#282A36` code panels (106 elements) |

Homepage order: hero with a typing animation, a benchmark chart, four tools in one
toolkit, "Who uses Bun?" naming three products with real quotes, what is different,
capability grid, then framework compatibility.

What makes it feel premium: 150px section padding is the largest regular rhythm in
the set and the 14px body size used at that scale of air. Also the only site here
with no webfont at all, which is a real page-weight lesson: `system-ui` with weight
800 at 53px looks intentional, not cheap.

## Biome

`https://biomejs.dev/`

Both modes. The closest structural analogue to margyn: a free CLI tool with a docs
site attached and no paid tier to sell.

| Property | Measured |
| --- | --- |
| Content max-width | 1080px, one container. Prose at 572px |
| Base font / line height | 16px / 28px (1.75), `-apple-system` stack, no webfont |
| h1 | 64px / 76.8px (1.2), weight 600, letter-spacing normal |
| h2 | 20px / 24px, weight 600. Section titles are barely bigger than body |
| Body copy | 16px / 28px |
| Small | 11.2px (0.7rem) is the most used size at 477 elements, then 14px (242), 16px (52) |
| Section rhythm | 24px on the wrapper. The section pitch is doing the work: 768, 1694, 2503, 3698, 4376, 5204, 5938, so roughly 800px per band |
| Radius census | 800px pills (32), 12px (15), 50% circles (15), 4px (7) |
| Borders vs shadows | 25 borders (all 1px) against exactly 1 shadow: `rgba(0,0,0,0.06) 0 1px 1px, rgba(0,0,0,0.06) ...` |
| Light background | `#FFFFFF` pure white, text `#353841` |
| Dark background | `#17181C`, text `#C0C2C7`, panels `#24272F` |

Homepage order: hero with an install command, format like Prettier, fix problems,
everything at once, Try Biome, a "Trusted by leading organizations" strip, community,
sponsors.

What makes it feel premium: one shadow on the whole page and 16px / 28px body copy.
Where it falls short is the 20px h2 against a 64px h1, which leaves an empty middle in
the scale. The 11.2px tier is also too small to be a comfortable caption.

## Astro

`https://astro.build/`

Both modes. Dark is `#060913`, the deepest blue-black in the set.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px (13 wrappers), 1536px for full bands, 896px and 768px for prose |
| Base font / line height | 16px / 24px, `ui-sans-serif` system stack |
| h1 | 48px / 52.8px (1.1), weight 700 |
| h2 | 36px / 40px (1.11), weight 300 for the statement, 16px / 24px weight 600 for card titles |
| h3 | 16px / 24px, weight 600 |
| Body copy | 18px / 27px (1.5) capped at 1024px, 16px / 24px in cards |
| Small | 16px (231), then 13.6px (0.85rem, 95 elements), 20px (26), 14px (14) |
| Section rhythm | 32px on the wrapper. The section pitch is tight: 1048, 1234, 1558, 2312, 2979, 3243 |
| Radius census | pill (58), 8px (29), 12px (25), 16px (21) |
| Borders vs shadows | 53 borders (all 1px) against 3 shadows |
| Light background | `#FFFFFF` |
| Dark background | `#060913`, panels `#0C0F19`, text `#F2F6FA` |

Homepage order: hero with install command, positioning statement, three pillars, Astro
Islands, zero lock-in, merch, a 14-item feature grid, themes, support, call to action,
sponsors.

Weak point worth learning from: the 14-item feature grid at 16px titles is the exact
pattern that flattens a page. Everything gets equal weight, so nothing is emphasised.
That grid is 1000px of page height that a reader skips.

## Deno

`https://deno.com/`

Both modes. The longest page in the set at 15,538px.

| Property | Measured |
| --- | --- |
| Content max-width | 738.1px is the dominant column (16 wrappers), 1280px for full bands, 672px and 576px for prose |
| Base font / line height | 16px / 24px, Inter |
| h1 | 72px / 79.2px (1.1), weight 700, letter-spacing -1.8px (-0.025em) |
| h2 | 72px / 79.2px for the big statement, 36px / 39.6px weight 700 for sections, 28px / 30.8px for sub-sections |
| h3 | 44px / 48.4px weight 700, then 36px / 39.6px |
| Body copy | 18px / 28px (1.55) for leads, 16px / 24px, 12px / 16px for captions |
| Small | 13.6px (0.85rem) leads at 292 elements, then 16px (245), 12px (177), 14px (111), 20px (78) |
| Section rhythm | no consistent padding. Section tops run 1002, 1289, 1721, 2170, 2733, 3248, 4191, so roughly 500 to 900px per band |
| Radius census | 4px (122), pill (86), 6px (36), 8px (34) |
| Borders vs shadows | 157 borders (149 at 1px) against 61 shadows. The signature shadow is a hard offset with zero blur: `rgb(102,194,255) 2px 4px 0 0` |
| Light background | white with `#191B1F` inverted panels |
| Dark background | serves the same page in both schemes. `prefers-color-scheme` is not honoured on the homepage |

Homepage order: hero, install command with an "or let your agent do it" variant,
everything just works, Node migration, built-in everything, cutting edge, security,
benchmarks, observability, deploy, desktop, a "Loved by developers" band, closing call
to action.

What is worth stealing: the 738px primary column, narrower than the 1280px band it
sits in, so the page has a text spine and full-bleed elements break out of it. The hard
2px 4px 0 offset shadow is a deliberate non-neutral choice and it dates the page a
little, but it is consistent.

## Cursor

`https://cursor.com/`

Both modes. Warm, the only site whose dark mode is warm-tinted (`#14120B`).

| Property | Measured |
| --- | --- |
| Content max-width | 1300px (16 wrappers), 810px, 658.3px (nine wrappers), 580px (seven) |
| Base font / line height | 16px / 24px, CursorGothic |
| h1 | 26px / 32.5px (1.25), weight 400, letter-spacing -0.325px. The smallest h1 in the set by far, because the hero is a sentence, not a slogan |
| h2 | 20px / 31px weight 700 for panel titles, 14px / 21px weight 400 for the proof-band label |
| h3 | 22px / 28.6px (1.3), weight 400, letter-spacing -0.11px |
| Body copy | 17.28px / 23.33px for the lead, 13px / 20.15px in cards |
| Small | 12px is the page (240 elements), then 16px (174), 14px (128), 11px (35) |
| Section rhythm | `67.2px/67.2px` on six sections (4.2rem), plus `112/67.2` and `67.2/134.4`. All multiples of 33.6 |
| Radius census | 4px (86), pill (72), 8px (35), 10px (8), 12px (7) |
| Borders vs shadows | 53 borders (52 at 1px) against 18 shadows. One heavy shadow exists for the floating hero card: `rgba(0,0,0,0.14) 0 28px 70px` |
| Light background | `#F7F7F4`, text `#26251E`. Warm off-white |
| Dark background | `#14120B` page, `#1B1913` panels, text `#EDECEC`. Warm off-black |

Homepage order: hero as a full sentence at 26px, a trusted-by band, agents turn ideas
into code, an interface walkthrough, autonomy, integrations, automation, the new way to
build software, models, changelog, team, recent highlights, closing call to action.

What makes it feel premium: a 26px h1 that is a complete sentence rather than a slogan,
and a warm neutral pair that is warm in both modes. The 12px tier carries most of the
page's information. Section padding as multiples of 33.6px is odd but consistent.

## Warp

`https://www.warp.dev/`

One theme only. It ignores `prefers-color-scheme`: identical computed styles under
both. Page is `#FBFDFD`, a very light cool off-white, with a saturated blue used as a
text and surface colour.

| Property | Measured |
| --- | --- |
| Content max-width | 1280px (eight wrappers), 768px, 672px, 576px (four wrappers) for prose |
| Base font / line height | 16px / 24px, Matter |
| h1 | 72px / 90px (1.25), weight 400, letter-spacing -2.52px (-0.035em) |
| h2 | 50.4px / 63px (1.25), weight 400, letter-spacing -1.764px (-0.035em) |
| h3 | 30px / 40px (1.33), weight 400, letter-spacing -1.05px (-0.035em) |
| Body copy | 16px / 24px, 15px, 14px / 21px, 12px / 18px |
| Small | 16px (245), 14px (185), 15px (45), 12px (43), 11px (23), 10px (20) |
| Section rhythm | `64/64` on four sections, plus `64/0` and `32/64`. 128px between bands |
| Radius census | 6px (46), pill (44), 4px (33), 3px (19), 8px (16), 1px (15) |
| Borders vs shadows | 55 borders (all 1px) against 40 shadows, including two real lifts: `rgba(0,0,0,0.12) 0 8px 30px` and `rgba(0,0,0,0.22) 0 12px 40px` |
| Light background | `#FBFDFD` |
| Dark background | none, same page under dark |

Homepage order: hero, agentic software factory, four numbered capability sections, an
open-source announcement band, get Warp with three platform cards, footer.

What makes it feel premium: one letter-spacing ratio (-0.035em) applied at 72px, 50.4px
and 30px, so the display tier is optically consistent at every size. Weight 400 at all
three. That single rule is the cleanest type discipline in the whole set.

## Raycast

`https://www.raycast.com/`

Dark only, `#07080A`. The most shadow-heavy page in the set by a wide margin.

| Property | Measured |
| --- | --- |
| Content max-width | 1204px (eight wrappers), 1440px full bleed, 1064px, 818px, 582px, 510px |
| Base font / line height | 16px / 18.4px (1.15) on body, which is unusually tight, then set looser per block |
| h1 | 64px / 70.4px (1.1), weight 600, letter-spacing normal |
| h2 | 20px / `normal`, weight 500, letter-spacing +0.2px. Section titles are small and positive-tracked |
| h3 | 56px / 65.52px weight 400 for the big statement, 24px for card titles |
| Body copy | 18px for leads, 16px / 25.6px (1.6) for copy |
| Small | 16px (146), 14px (97), 24px (26), 12px (11), 13px (8) |
| Section rhythm | `224px/224px` on six sections. 448px between bands, the largest in the set |
| Radius census | 11px (159 elements) then 8px (109), 6px (63), 12px (53), 20px (35), 16px (29) |
| Borders vs shadows | 320 shadows against 90 borders, over 2231 elements. Shadow-led, with a stacked keycap as the signature: `rgba(0,0,0,0.4) 0 1.5px 0.5px 2.5px, rgb(0,0,0) ...` plus a `rgb(27,28,30) 0 0 0 1px, rgb(7,8,10) 0 0 0 1px` double ring |
| Light background | none |
| Dark background | `#07080A`, with 88 elements painting pure `#FFFFFF` on it |

Homepage order: hero, take shortcuts, not about saving time, extensions with a count,
your Mac got smarter, built for professionals, don't repeat yourself, stay in the loop,
build the perfect tools, closing call to action. Ten bands in 15,626px.

What makes it feel premium: the 11px radius. It is an odd number, chosen to match macOS
control geometry, then used on 159 elements, so it becomes the page's signature. The
double-ring shadow (`0 0 0 1px` twice, in two dark values) reads as a physical bevel with
no gradient. This is the one page in the set where heavy shadow is the right call, because
the product is a native macOS app and the page is imitating its chrome.

## The whole set on one screen

Body size is 16px on all twenty. Nothing else is unanimous.

| Site | body / lh | h1 px | h1 lh | h1 tracking | h1 weight | outer max-w | section pad | radius 1st | borders per 1k | shadows per 1k |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| linear | 16/24 | 64 | 1.0 | -0.022em | 510 | 1436 | 128/128 | 2px | 48 | 40 |
| vercel | 16/24 | 64 | 1.0 | -0.060em | 400 | 1080 token | none | 6px | 0 | 18 |
| resend | 16/24 | 96 | 1.0 | -0.010em | 400 | 1280 | 96/96 | pill | 122 | 5 |
| planetscale | 16/24 | 16 | 1.5 | normal | 700 | 1280 | none | none | 121 | 0 |
| tailscale | 16/24 | 64 | 1.1 | -0.010em | 500 | 1440 | 64/64 | 16px | 142 | 116 |
| clerk | 16/24 | 64 | 1.125 | -0.025em | 700 | 1264 | 128/172 | pill | 12 | 130 |
| railway | 16/26 | 54 | 1.12 | -0.036em | 500 | 1160 | 96/0 | 8px | 3 | 2 |
| neon | 16/24 | 68 | 1.125 | -0.040em | 400 | 960 | 160/160 | 4px | 13 | 7 |
| turso | 16/normal | none | n/a | -0.025em on h2 | 800 | 1280 | none | pill | 61 | 0 |
| sentry | 16/32 | 88 | 1.2 | normal | 700 | 949 | 0/128 | 10px | 5 | 2 |
| stripe | 16/normal | 48 | 1.15 | -0.020em | 300 | 1266 | 96/96 | 4px | 24 | 4 |
| supabase | 16/24 | 46 | 1.0 | normal | 500 | 1280 | 96/96 | 8px | 34 | 4 |
| val.town | 16/24 | 48 | 1.2 | -0.025em | 400 | 1280 | 80/80 | pill | 23 | 27 |
| bun | 16/24 | 53.3 | 1.0 | normal | 800 | 1280 | 150/150 | pill | 38 | 5 |
| biome | 16/28 | 64 | 1.2 | normal | 600 | 1080 | none | pill | 21 | 0 |
| astro | 16/24 | 48 | 1.1 | normal | 700 | 1280 | none | pill | 53 | 3 |
| deno | 16/24 | 72 | 1.1 | -0.025em | 700 | 738 | none | 4px | 89 | 34 |
| cursor | 16/24 | 26 | 1.25 | -0.013em | 400 | 1300 | 67.2/67.2 | 4px | 34 | 11 |
| warp | 16/24 | 72 | 1.25 | -0.035em | 400 | 1280 | 64/64 | 6px | 55 | 40 |
| raycast | 16/18.4 | 64 | 1.1 | normal | 600 | 1204 | 224/224 | 11px | 40 | 143 |

Backgrounds, for the record only:

| Site | light | dark | honours prefers-color-scheme |
| --- | --- | --- | --- |
| linear | none | `#08090A` | no, dark only |
| vercel | `#FAFAFA` | `#0A0A0A` | yes |
| resend | none | `#000000` | no, dark only |
| planetscale | `#FAFAFA` | `#111111` | yes |
| tailscale | `#F9F7F6` | none | no, light only |
| clerk | `#F7F7F8` | none | no, light only |
| railway | none | `#13111C` panels `#0B0B0F` | no |
| neon | none | `#000000` panels `#18191B` | no |
| turso | none | `#0D1318` panels `#293945` | no |
| sentry | none | `#1F1633` panels `#150F23` | no |
| stripe | white with `#F8FAFD` and `#E5EDF5` bands | none | no |
| supabase | `#FDFDFD` cards `#FFFFFF` | `#131413` cards `#181A19` | yes |
| val.town | `#FFFFFF` | none | no |
| bun | none | `#14151A` panels `#282A36` | no |
| biome | `#FFFFFF` | `#17181C` panels `#24272F` | yes |
| astro | `#FFFFFF` | `#060913` panels `#0C0F19` | yes |
| deno | white, inverted panels `#191B1F` | same page | no |
| cursor | `#F7F7F4` | `#14120B` panels `#1B1913` | yes |
| warp | `#FBFDFD` | same page | no |
| raycast | none | `#07080A` | no |

Six of twenty ship a real light and dark pair. Of the six, four use an off-white rather
than pure white: `#FAFAFA`, `#FDFDFD`, `#F7F7F4` and `#FBFDFD`. Two use pure white
(biome, astro). Not one of the six uses pure black for dark: `#0A0A0A`, `#111111`,
`#131413`, `#17181C`, `#060913`, `#14120B`. The margyn palette (`#FBFAF8` light,
`#0E0F12` dark) sits inside both distributions.

## Alignment, grids, gaps and weight

Also measured on all twenty, at 1440px, light scheme. Transfer bytes come from
`content-length` on each response, so they are a lower bound and a page that omits the
header reads as smaller than it is (PlanetScale reports zero for that reason).

| Site | hero align | hero text width | centred / left-aligned text blocks | grid column counts seen | most common gap | emoji headings | mono blocks | transfer KB | font KB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| linear | start | 1282 | 1 / 35 | 2 cols x17 | 8px | 0 | 5 | 2216 | 501 |
| vercel | left | 444 | 2 / 42 | none | 6px | 0 | 6 | 305 | 219 |
| resend | left | 480 | 13 / 36 | 2, 3, 6 | 16px | 0 | 215 | 8669 | 622 |
| planetscale | start | 1104 | 0 / 42 | 5 cols x2 | 24px | 0 | 1 | n/a | 0 |
| tailscale | center | 1312 | 7 / 67 | 3 cols x2 | 12px | 0 | 17 | 1426 | 162 |
| clerk | center | 896 | 21 / 140 | 2 cols x5 | 8px | 0 | 24 | 1205 | 259 |
| railway | center | 588 | 14 / 67 | 3 cols x2 | 8px | 0 | 2 | 3663 | 178 |
| neon | start | 1120 | 0 / 41 | 2 cols x6 | 8px | 0 | 8 | 4862 | 138 |
| sentry | center | 1004 | 3 / 94 | 2 cols x1 | 6px | 0 | 98 | 1078 | 39 |
| stripe | start | 958 | 13 / 83 | 2 x16, 3 x16 | 8px | 0 | 0 | 1152 | 69 |
| supabase | start | 536 | 3 / 89 | 2, 4, 5, 6 | 8px | 0 | 2 | 671 | 164 |
| val.town | start | 784 | 0 / 10 | 2, 3 | 16px | 0 | 3 | 1229 | 197 |
| bun | start | 700 | 24 / 99 | 2 cols x6 | 4px | 0 | 85 | 1826 | 0 |
| biome | start | 667 | 10 / 31 | 2 cols x62 | 16px | 0 | 13 | 223 | 0 |
| astro | center | 704 | 17 / 72 | 2 x16, 3 x10 | 8px | 0 | 7 | 199 | 190 |
| deno | left | 624 | 16 / 38 | 2 x24, 3 x14 | 16px | 0 | 229 | 2465 | 425 |
| cursor | left | 658 | 3 / 48 | 2 cols x6 | 8px | 0 | 6 | 3333 | 764 |
| warp | start | 1200 | 7 / 57 | 2, 3, 5 | 12px | 0 | 44 | 2104 | 304 |
| raycast | center | 540 | 15 / 58 | 2 cols x38 | 8px | 0 | 115 | 1480 | 226 |
| turso | center | 1024 | 12 / 38 | 2 cols x7 | 16px | 0 | 2 | 804 | 116 |

Three facts fall out of that table:

- **Zero emoji headings across all twenty sites.** Not one h1, h2 or h3 on any of these
  pages contains an emoji.
- **Left-aligned text wins everywhere.** The worst ratio in the set is bun at 24 centred
  against 99 left. Six sites centre the hero specifically, then go left for everything
  below it. Two sites (planetscale, neon, val.town) centre nothing at all.
- **Two columns is the default grid, not three.** biome uses a 2-column grid 62 times,
  raycast 38, deno 24, stripe 16 and 16. Three-column grids appear, but they are the
  minority everywhere except tailscale and railway, which use them once or twice each.
  Nobody builds their page out of three-across icon cards.

## SHARED PATTERNS

Rules with numbers, ready to implement. Each one is what the better sites in the set
actually do, with the outliers named.

**1. Body text is 16px. Full stop.** All twenty. Do not ship 15px or 17px body.
Line height 1.5 is the median (24px on 16px). The range that works is 1.5 to 1.75:
linear, vercel, resend, planetscale, neon, supabase, val.town, bun, astro, deno,
cursor, warp all sit at exactly 24px. railway runs 26px, biome 28px, sentry 32px.
Sentry gets away with 2.0 only because its column is 949px. Pick **16px / 26px** for a
1000px-ish column. Use 16px / 24px if the column is wider.
Never leave it `normal`: turso and stripe do and it is a defect, not a style.

**2. Outer container 1080 to 1280px, text column 620 to 740px.** The mode of the set is
1280px (resend, planetscale, turso, supabase, val.town, bun, astro, warp). vercel's own
token is 1080px, biome is 1080px. Then a second, much narrower measure carries the prose:
deno 738px, cursor 658px, biome 572px, stripe 752px, warp 576px, supabase 512px,
resend 480px. Two containers, not one. Set `--w-page: 1120px` and `--w-prose: 680px` and
never let a paragraph span the page width.

**3. Display type: h1 between 48 and 72px, line height 1.0 to 1.2, weight 400 to 600,
tracking -0.02em to -0.035em.** The cluster is tight. 64px appears five times (linear,
vercel, tailscale, clerk, biome, raycast), 48px four times, 72px twice. Line height at or
under 1.2 in every case except cursor and warp at 1.25. Negative tracking on 13 of 19,
and the good ones scale it with size rather than fixing a px value. Warp is the model: one
ratio, -0.035em, at 72px, 50.4px and 30px alike. **Use -0.025em on anything over 32px and
nothing under.** Weight: linear 510, vercel 400, neon 400, warp 400, stripe 300. Heavy
display weight (bun 800, turso 800, clerk 700) reads louder, not more expensive.

**4. Four sizes, not eight.** The working scale across the set is
**h1 56px, h2 32px, body 16px, small 13px**, with an optional 20px lead. Every site has a
dominant small tier and it is 13px or 14px on the premium end (linear 14px, vercel 14px,
clerk 13px, cursor 12px, resend 12px, deno 13.6px) and 16px on the plainer end (tailscale,
neon, sentry, stripe). Do not go below 12px. biome's 11.2px tier on 477 elements is the
one clear mistake in the set.

**5. Section rhythm is one number, reused.** The sites that read expensive pick a single
padding and never vary it: resend 96/96 on nine sections, bun 150/150 on seven,
raycast 224/224 on six, cursor 67.2/67.2 on six, neon 160/160, linear 128/128,
warp 64/64, val.town 80/80. **96px top and bottom is the safe middle**, which is 192px
between bands. Under 64px the page reads cramped, over 160px it reads like a slide deck
unless there are very few sections. Whatever you pick, do not vary it per section.

**6. Small radius, one value, plus a pill for controls.** The premium end lives at 2 to
8px: linear 2px, neon 4px, stripe 4px, cursor 4px, deno 4px, vercel 6px, warp 6px,
railway 8px, supabase 8px. The larger-radius sites (tailscale 16px, raycast 11px) are
imitating OS chrome on purpose. planetscale ships one radius on the entire page.
**Pick 6px for surfaces, 4px for inputs and code, 9999px only for pills and avatars.**
Never mix 8px, 12px and 16px on the same page.

**7. Separate with a 1px hairline, not a shadow.** Border-led beats shadow-led here.
resend 122 borders per 1000 visible elements against 5 shadows. planetscale 121 against
zero. biome 21 against exactly one shadow on the whole page. turso 61 against zero.
The two shadow-led sites are clerk (130 per 1000) and raycast (143) and both are
imitating a native app surface. Where a shadow is used well it is a **ring**, not a drop:
vercel `0 0 0 1px rgba(0,0,0,0.08)` plus `0 1px 2px rgba(0,0,0,0.04)`,
clerk `0 0 0 1px rgba(0,0,0,0.06)` plus a `0 1px 0 rgba(255,255,255,0.05)` inset top
highlight, supabase `inset 0 0 0 1px rgba(255,255,255,0.12)` for the dark-mode hairline.
The ring composes with radius and adds no layout width. **Reserve exactly one real drop
shadow for the one element that floats** (stripe uses `0 20px 40px -20px rgba(0,0,0,0.1)`
on the hero card and nothing else; cursor uses `0 28px 70px rgba(0,0,0,0.14)` once).

**8. Two surfaces, one step apart, in both modes.** Supabase is the template:
page `#FDFDFD` and card `#FFFFFF` in light, page `#131413` and card `#181A19` in dark, a
1px border on the card in both. The card is lighter than the page in both modes, so the
same rule works twice. railway does it with `#13111C` page and `#0B0B0F` panel, tailscale
with `#F9F7F6` page and pure white cards on 127 elements. **Define exactly two background
values per mode and derive everything else from the border.**

**9. Left-align everything except, at most, the hero.** 18 of 20 keep body copy and
section headings left. Six centre the hero and then stop. Nobody centres a full page.

**10. Two columns is the grid.** 2-across is the most-used grid on biome, raycast, deno,
stripe, clerk, neon, bun, cursor and turso. Grid gap clusters at 8px for tight rows and
16 to 24px for content cards. planetscale and stripe use 24px and 32px to 64px for the
biggest bands.

**11. Section count is low and every section earns its place.** val.town ships four bands
and two headings in a 5016px page. vercel ships three product sections plus a changelog in
5433px. The long pages (raycast 15,626px, deno 15,538px, bun 16,452px) belong to products
with a decade of surface area to describe. A pre-launch product with one paid tier should
target **five to seven bands and a document under 6000px**.

**12. Monospace is a first-class tier for a developer tool.** deno renders 229 mono blocks,
resend 215, sentry 98, bun 85, raycast 115. planetscale sets the *whole page* in mono at
16px / 24px. For an audit tool whose output is terminal text, mono is the honest voice, and
planetscale proves a full-mono page can look expensive rather than lazy.

**13. Page weight is a design choice.** With `content-length` as a lower bound: astro
199 KB, biome 223 KB, vercel 305 KB, supabase 671 KB, turso 804 KB, at the low end. At the
high end resend transfers 8.6 MB, of which 5.8 MB is imagery. Fonts alone: cursor 764 KB,
resend 622 KB, linear 501 KB, deno 425 KB. **bun and biome ship zero font bytes** and both
look deliberate, bun with `system-ui` at weight 800 and biome with `-apple-system` at
weight 600. For a single hand-written HTML file in a Worker, that is the pattern to copy:
no webfont at all. If one is needed, ship a single variable font subset and nothing else.

## ANTIPATTERNS

Everything here was counted on the same twenty pages, so each claim has a number behind
it. Where an antipattern turns up on a good site, that is recorded too, with the reason it
survives there.

**1. The gradient hero blob. Effectively dead.** Elements with `filter: blur(30px)` or
higher and a width over 150px, across all twenty pages: vercel 3, clerk 1, deno 1,
raycast 1, then zero on the other sixteen. Vercel's three are 120px blurs on a 921x160 box
sitting *under* a product screenshot, a glow behind a real thing, not a decorative shape.
Raycast's is a 38px blur on 1156x244 behind its keycap row. Radial gradients tell the same
story: zero on planetscale, tailscale, railway, neon, supabase, val.town, cursor and warp.
Raycast's 192 radial gradients are keycap bevels at 40px scale, not page-sized blobs.
So a blurred purple ellipse behind the hero is not a premium signal, it is the single
loudest marker of a template. If you want depth behind a hero, put a real artefact there
and glow *that*.

**2. The three-icon feature grid. Almost nobody does it.** Counting 3-column grids where
at least three children carry both a 16 to 64px SVG and a heading: resend 2, astro 2,
bun 1, then **zero on the other seventeen**. Two-column grids, by contrast, are used 62
times on biome, 38 on raycast, 24 on deno, 16 on stripe. The premium pattern is one idea
per band with a large heading and a real visual, repeated four to six times down the page.
When a grid is used it is 2-up with substantial content in each cell, not 3-up with an icon,
four words and a sentence.

**3. Icon soup in place of hierarchy.** Astro's 14-item feature grid at 16px titles is
about 1000px of page height in which nothing is emphasised, so a reader skips all of it.
Same failure mode as the three-icon row, just wider. If everything is the same size, the
page has no argument, only a list. Margyn has one claim: prove the checks do not check.
That does not become clearer by being split into twelve equal cards.

**4. Fake or decorative dashboard screenshots.** Every screenshot in the set is of the real
product: vercel ships `notion-desktop-light.webp` and `zapier-desktop-light.webp`,
val.town ships `val-screen.webp` and `val-screen-sqlite.webp`, planetscale ships
`insights-p50-p95-p99.png`, sentry ships `install-1-line.webp` and `automatic-rca.webp`.
Nobody in the set mocks a UI that does not exist and nobody uses a generic "analytics
dashboard" illustration. For margyn the equivalent is direct: show the actual CLI output
and the actual reproduction, captured from a real run. A hand-drawn approximation of a
report is worse than plain text.

**5. Stock photography. Zero instances.** Across twenty pages and 152 raster images over
240x160, there is not one photograph of a person, a desk, a handshake or an office. The
raster images are product screenshots (vercel, val.town, sentry, planetscale, supabase),
generated abstract art (railway `bg-train-dusk.webp`, deno `lofi-hero-bg.webp`, clerk
`circuit-lines@2xl.webp`, astro `HeroBackground.png`, stripe `wave-fallback-desktop.png`)
and logo marks. A photo of a developer at a laptop would be the loudest possible tell.

**6. Centring the whole page.** 18 of 20 keep body copy and section headings left-aligned.
The worst centred-to-left ratio in the set is bun at 24 against 99. Six sites centre the
hero and stop there. planetscale, neon and val.town centre nothing at all. A page where
every heading and every paragraph is centre-aligned reads as a template with the content
poured in, because it means nobody made a per-section decision.

**7. Emoji section headers. Zero instances, all twenty sites.** Not one h1, h2 or h3
across the set contains an emoji. This is the clearest binary result in the whole study.
An emoji in a heading is a README convention that does not survive on a marketing page.

**8. The "Trusted by" logo wall, especially with nothing to put in it.** Eight of twenty
carry the words "Trusted by" (planetscale, clerk, railway, neon, supabase, val.town,
biome, cursor) and three carry "Loved by" (railway, sentry, deno). Detected logo strips
(a container of 4 to 20 similar-height media children): clerk 18, warp 11, turso 7,
linear 5, astro 4, neon 4, resend 4, raycast 4, deno 4, biome 3, tailscale 3, sentry 3,
supabase 3. So it is common, but every one of those companies has real customers to name,
and the good ones name them in prose rather than a logo grid: bun writes "Claude Code uses
Bun", "Railway Functions powered by Bun", "Midjourney uses Bun" as three headings with
quotes attached. Margyn is pre-launch. A logo wall would be a lie, an empty one is worse
than absent. A "trusted by" strip filled with the languages it supports is the cheapest
possible dodge. Skip the band entirely and let the reproduction be the proof.

**9. Testimonial cards with no attribution.** Stripe's page mentions testimonials 198 times
in markup and every one is a named company with a figure attached (`URBN consolidates
$5 billion`, `Businesses on Stripe generated US$1.9tn in 2025`). Turso ships a
"Don't just take our word for it" band. The pattern only works with real names. Three
rounded cards with a grey circle, a first name and a job title is the second-loudest
template tell after the gradient blob.

**10. Word count as a symptom.** Measured `innerText` word count: vercel 125, val.town 275,
warp 665, neon 734, biome 754, astro 796. At the other end railway 2699, resend 2632,
bun 2288, sentry 2148. The short pages belong to products that trust one claim; the long
ones belong to products with a decade of surface area. A pre-launch tool writing 2000 words
is padding and padding is visible as page height. Target **under 800 words**.

**11. An eight-step type scale.** Sites that read cheap use every size from 11px to 72px.
The set's premium end uses four: display, section, body, small. biome's 11.2px tier on 477
elements and its 20px h2 against a 64px h1 leave a hole in the middle of the scale and a
caption too small to read, in the same page.

**12. Unset line height.** turso and stripe both leave body `line-height: normal`, which
resolves differently per font and per browser. On turso, whose hero is weight 800 at 72px,
the result is a page whose vertical rhythm cannot be relied on. This is not a style choice.
Set it.

**13. Varying section padding per section.** Sites that read composed pick one number and
repeat it (resend 96/96 nine times, raycast 224/224 six times, cursor 67.2/67.2 six times).
Sites that read assembled have a different value on every band. If a section needs to sit
tighter, zero one side rather than inventing a new number: sentry uses `0/128` when two
bands abut, keeping 128 as the only unit on the page.

**14. Radius drift.** Mixing 4px inputs, 8px cards, 12px panels and 16px images on one page
is the visual equivalent of four different fonts. clerk and vercel both publish a full
`--radius-xs` through `--radius-4xl` scale from a framework preset, then in practice use two
values. Ship the two values, not the scale.

**15. Heavy drop shadows to fake depth.** The two shadow-heavy pages in the set
(raycast 143 per 1000 elements, clerk 130) are imitating native app chrome on purpose and do
it with `0 0 0 1px` rings and inset highlights, not blurred grey. Where a real shadow
appears it is once per page on the one thing that floats. A page where every card has
`0 4px 12px rgba(0,0,0,0.1)` reads as a 2019 Bootstrap theme.

**16. Full-bleed prose.** Nobody lets a paragraph span the outer container. Every site has
a second, narrower measure: deno 738px, stripe 752px, cursor 658px, warp 576px, biome 572px,
supabase 512px, resend 480px. Text running the full 1280px is the fastest way to make a page
look unedited.

## What this means for margyn, concretely

A single hand-written HTML file with inline CSS and one ES module, bundled into a Worker.
The constraint points at the same answer the measurements do.

Numbers to set, all justified above:

```
--w-page:   1120px     /* between vercel's 1080 and the 1280 mode */
--w-prose:   680px     /* deno 738, stripe 752, cursor 658, biome 572 */
--pad-band:   96px     /* resend uses exactly this on nine sections */
--r-surface:   6px     /* vercel and warp */
--r-input:     4px     /* stripe, neon, cursor, deno */
--fs-h1:      56px     /* inside the 48 to 72 cluster */
--fs-h2:      32px
--fs-body:    16px     /* unanimous */
--fs-small:   13px     /* clerk 13, deno 13.6, linear 14 */
--lh-body:    1.6      /* 25.6px, between the 1.5 mode and railway's 1.625 */
--lh-display: 1.05     /* linear, vercel, resend and supabase all sit at or near 1.0 */
--track-display: -0.025em   /* apply above 32px only */
```

Separation: a 1px hairline everywhere, one surface step between page and card in both modes,
and exactly one real drop shadow reserved for whichever single element should float. No
`box-shadow` on cards. Use `box-shadow: 0 0 0 1px <hairline>` where the border must not add
layout width.

Typography: no webfont. bun and biome both ship zero font bytes and read deliberate. Use a
system stack for prose and `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` for
every piece of tool output. Given margyn's product is terminal output and a reproduction,
planetscale's full-mono page at 16px / 24px is a live option worth prototyping: it is the
one page in the set that reads as a document produced by a tool rather than a page selling
one. It also needs no images at all.

Homepage order, drawn from what the good short pages do (vercel three bands, val.town four,
warp five) and from the fact that margyn has no customers to cite:

1. Hero. One claim, left-aligned, 56px, prose capped at 680px, one primary action.
2. The proof. A real reproduction from a real run, verbatim, in mono. This replaces the
   screenshot band every other site has and it is the whole product.
3. How it works, as three to four numbered bands, one idea each, 2-up at most.
4. The free CLI: install command, exactly as biome, astro, deno and bun all do.
5. The paid tier: one price, one table, no comparison matrix.
6. Honest status. Pre-launch, said plainly. This is where a rival puts the logo wall, and
   saying "no customers yet, here is the reproduction" is stronger than an empty strip.
7. Footer.

That is seven bands. At 96px padding and 192px between bands, it lands near 5000 to 6000px,
which is val.town and vercel territory rather than raycast's 15,626px.

What to leave out, all measured as either rare or absent in the set: no blurred hero blob
(4 sites out of 20, all four glowing a real object), no three-icon grid (3 sites out of 20),
no emoji headings (0 of 20), no stock photography (0 of 20), no logo wall (we have nothing
to put in it), no testimonial cards (we have no testimonials), no centred body copy
(18 of 20 are left-aligned).

## URLs fetched

Every page below was fetched over HTTPS on 2026-08-05, then loaded in headless Chrome at
1440x1000 under both `prefers-color-scheme` values. Every number in this file is read
off those live pages.

- `https://linear.app/`
- `https://vercel.com/`
- `https://resend.com/`
- `https://clerk.com/`
- `https://railway.com/` (railway.app redirects here)
- `https://planetscale.com/`
- `https://neon.com/` (neon.tech redirects here)
- `https://turso.tech/`
- `https://sentry.io/welcome/`
- `https://tailscale.com/`
- `https://stripe.com/` (served `https://stripe.com/in` from this location)
- `https://supabase.com/`
- `https://www.val.town/`
- `https://bun.sh/`
- `https://biomejs.dev/`
- `https://astro.build/`
- `https://deno.com/`
- `https://cursor.com/`
- `https://www.warp.dev/`
- `https://www.raycast.com/`

Stylesheets were also downloaded and parsed for published design tokens, which is where the
`--geist-radius: 6px`, `--geist-marketing-radius: 8px`, `--geist-page-width: 1200px`,
`--ds-page-width: 1400px`, `--max-width: 1080px`, `--content-width: 43.5rem`,
`--radius-xs` through `--radius-4xl` and `--container-3xs` through `--container-7xl` values
quoted above come from.
