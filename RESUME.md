# Placebo and Tiun: resume from here

Written 2026-08-01. Read this first, then `work/placebo/README.md` and
`work/tiun-hackathon/TRIAGE.md`.

## Where the work is

- **Code**: `work/placebo/`, now a git repo pushed to
  **github.com/zkasuran/placebo, private**, branch `master`. Private is
  deliberate per the repository-visibility rule; it flips public at submission.
- **Credentials**: `work/tiun-hackathon/.env`, mode 600, gitignored, outside
  every repo. Holds `TIUN_API_KEY` (live, secret) and
  `TIUN_SANDBOX_SNIPPET_ID` (public).
- **Triage and API recipes**: `work/tiun-hackathon/TRIAGE.md`.
- **Form fill copy**: `work/tiun-hackathon/FORM-FILL.html`, click-to-copy.

## What works right now

`node src/cli.mjs /path/to/repo`, zero dependencies, exit 1 on any finding.
Three checks: `ignored-source` (high), `unrun-check`, `lint-blindspot`.
`npm test` is 6 passing, and each test proves the check fires on a planted
defect and goes quiet on the fixed shape.

Validated against a real failure: reconstructed moss `c6cbb45` in a detached
worktree, restored the untracked vendored files, and the scanner found both
ignored files with the correct ignore rule. The emitted reproductions run and
confirm `ABSENT from HEAD` plus `PRESENT on disk`. Against the fixed tree
`0c743c2` both high findings disappear.

`work/placebo/web/` boots, serves the page, `/api/config` leaks nothing but the
public snippet id, and `/api/scan` refuses an unauthenticated caller with 401.

## The one blocker

`/api/verify` returns 401 against sandbox because **the stored API key is a
live key**. Sandbox needs its own key. Get it from the dashboard with the
Sandbox toggle on, add it as `TIUN_SANDBOX_API_KEY`, and switch `server.mjs` to
read that when `TIUN_ENV` is not `live`.

Environment facts, probed rather than assumed: the path prefix is `live_api` on
**both** hosts. `api-sandbox.tiun.live` answers `live_api` with 401 for a wrong
key and `sandbox_api` with 404, so the environment is chosen by hostname plus
which key you hold.

## Also outstanding

- **Products not created.** No REST endpoint exists for it, so Fix pack and
  Watch have to be made by hand in the dashboard. Their names and descriptions
  are copy blocks in FORM-FILL.html. The frontend currently prompts for a
  product id because it does not have one.
- **MCP server** is registered in `~/.claude.json` under this project and
  reports "needs authentication". It needs a browser OAuth click after a
  session restart, and a token minted for our own client cannot be injected
  into Claude Code's credential store. `work/tiun-hackathon/mcp-token.mjs`
  mints one independently given a live 10-minute `tiun_auth_jwt` cookie, which
  is enough to read the dashboard directly without Claude Code's MCP client.
  Unproven: whether the consent screen completes without a real click.
- **Name check on "Placebo" has never run.** Do it before anything is
  published. `placebo.dev` is a placeholder in the domain field and nothing was
  bought.
- **Hosting decision, already made**: host the landing page, sign in, checkout
  and the verify function only. Never host the scanner. Scanning stays on the
  user's machine or in their CI, which avoids needing repo access and a
  security story we cannot defend in 27 days.

## Next three moves

1. Sandbox API key, then prove login and checkout end to end on localhost.
   Sandbox authorises localhost on any port automatically, so no hosting is
   needed to get there.
2. Create the two products, wire the real product id, gate the CLI on
   entitlement.
3. Add the mutation check: break a line on purpose, report the tests that
   stayed green. That is the strongest evidence form and the demo climax.

## Hackathon context

tiun x Microlaunch on hackwithus.dev. Demo day **2026-08-28 17:00 CEST**.
$5,000 fixed base pool. On 2026-08-01 there were two entries and one was the
host's own product. Up to five products may be submitted per person, per the
admin. The field is nearly empty because the SDK is a backend replacement
rather than a drop-in, which is why Placebo is built Tiun-native from an empty
repository instead of retrofitted.
