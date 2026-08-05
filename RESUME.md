# Margyn and Tiun: resume from here

Written 2026-08-01, rebranded 2026-08-05. Read this first, then
`work/margyn/README.md` and `work/tiun-hackathon/TRIAGE.md`.

## The rebrand (2026-08-05)

The product was called **Placebo** on **placebo.top**. It is now **Margyn** on
**margyn.xyz**. Done in code and on GitHub: the lane directory `work/placebo` to
`work/margyn`, the repo `zkasuran/placebo` to `zkasuran/margyn` (GitHub keeps a
redirect from the old path), the git remote, the package name and `bin` entry, the
CLI banner, the page title and heading, the temp-dir prefix in the tests, the
README and the onboarding copy in `work/tiun-hackathon/FORM-FILL.html`.

Two things live in the Tiun dashboard and cannot be changed from code:

1. The sandbox snippet's content URL is still `https://placebo.top/`. It has to be
   repointed to `https://margyn.xyz/` at my.tiun.business.
2. The one product that exists in the sandbox account is named **PlaceBo Sub**
   (`p-test-522721e`, subscription, USD 8.99 a month, no trial). Renaming it is a
   write against the provider account, so it waits for a yes.

## Where the work is

- **Code**: `work/margyn/`, git repo pushed to **github.com/zkasuran/margyn,
  private**, branch `master`. Private is deliberate per the repository-visibility
  rule; it flips public at submission.
- **Credentials**: `work/tiun-hackathon/.env`, mode 600, gitignored, outside every
  repo. Holds `TIUN_API_KEY` (live, secret), `TIUN_SANDBOX_API_KEY`,
  `TIUN_SANDBOX_SNIPPET_ID` (public) and the two product ids.
- **Triage and API recipes**: `work/tiun-hackathon/TRIAGE.md`.
- **Form fill copy**: `work/tiun-hackathon/FORM-FILL.html`, click-to-copy.

## What works right now

`node src/cli.mjs /path/to/repo`, zero dependencies, exit 1 on any finding. Five
checks: `ignored-source` (high), `no-assertion` (high), `unrun-check`,
`lint-blindspot`, plus `mutation` (high, opt-in behind `--mutate`). `npm test` is
**10 passing, 0 failing**, re-run 2026-08-05 after the rename. Each test proves the
check fires on a planted defect and goes quiet on the fixed shape.

Validated against a real failure: reconstructed moss `c6cbb45` in a detached
worktree, restored the untracked vendored files, then the scanner found both ignored
files with the correct ignore rule. The emitted reproductions run and confirm
`ABSENT from HEAD` plus `PRESENT on disk`. Against the fixed tree `0c743c2` both
high findings disappear.

`work/margyn/web/` boots, serves the page, `/api/config` leaks nothing but the
public snippet id. `/api/scan` refuses an unauthenticated caller with 401.

## Open items

- **`/api/verify` against sandbox was blocked on a live-only key.**
  `TIUN_SANDBOX_API_KEY` is now set and `server.mjs` picks the key by `TIUN_ENV`,
  so it should pass. It has not been re-run end to end since the rename. Prove
  login plus checkout on localhost before trusting it.
- **Fix pack is unverified. Its absence from a listing proves nothing.** A live
  `get_products` on 2026-08-05 returned exactly one product, the subscription
  `p-test-522721e`. That is not evidence Fix pack is gone: the endpoint documents
  itself as listing subscription and time-based products. Fix pack is a one-time
  purchase, so it may simply not be enumerated there. `.env` still
  carries `TIUN_SANDBOX_PRODUCT_FIXPACK=p-test-796f119` and the button still mounts.
  The only way to settle it is to open the dashboard or click the button in sandbox
  and see whether checkout resolves. Do that before the demo, because a checkout
  button that 404s on stage is worse than one fewer product.
- **Price drift, one confirmed.** The subscription really charges USD 8.99 a month,
  so the Watch blurb is corrected to 8.99. Fix pack's "One-time, 19" was never
  confirmed against the dashboard; check it in the same pass.
- **margyn.xyz is registered but serves nothing.** Spaceship nameservers
  (`launch1/launch2.spaceship.net`), a parking page over plain HTTP on
  34.216.117.25, **and no TLS listener at all**, so `https://margyn.xyz/` fails to
  connect. Tiun's snippet URL and any submission link have to be https, so hosting
  is a blocking step, not a polish step.
- **Name check on "Margyn" is partly done.** `margyn` is free on npm (404). The
  GitHub org `margyn` is taken but empty, created 2026-04-05, zero public repos, so
  `zkasuran/margyn` is unaffected. `margyn.com` redirects to `margyn.ai`, which
  does not answer, so someone holds those two. Not a blocker for a `.xyz` product,
  worth knowing before any trademark claim.
- **MCP server** is registered in `~/.claude.json` under this project and reports
  "needs authentication". `work/tiun-hackathon/mcp-token.mjs` mints a token
  independently given a live 10-minute `tiun_auth_jwt` cookie. The tiun MCP tools
  in this session read providers and products directly, which is enough for
  discovery.
- **Hosting decision, already made**: host the landing page, sign in, checkout and
  the verify function only. Never host the scanner. Scanning stays on the user's
  machine or in their CI, which avoids needing repo access and a security story we
  cannot defend in 23 days.

## Next three moves

1. Point margyn.xyz at real hosting with TLS, then update the snippet content URL
   in the Tiun dashboard from placebo.top to margyn.xyz.
2. Sandbox verify end to end on localhost, then settle the products: rename the
   subscription, recreate or drop Fix pack, fix the price copy.
3. Gate the CLI on entitlement, which is the last piece the demo needs.

## Hackathon context

tiun x Microlaunch on hackwithus.dev. Demo day **2026-08-28 17:00 CEST**, so 23
days left as of 2026-08-05. $5,000 fixed base pool, rising to $10k at 100 verified
entries. The public page on 2026-08-05 shows **0 submissions** and "the first
submission will start the leaderboard", with week 1 framed as "validate and build".
Up to five products may be submitted per person, per the admin. The field is nearly
empty because the SDK is a backend replacement rather than a drop-in, which is why
Margyn is built Tiun-native from an empty repository instead of retrofitted.
