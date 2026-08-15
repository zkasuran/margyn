# Margyn

[![ci](https://github.com/zkasuran/margyn/actions/workflows/ci.yml/badge.svg)](https://github.com/zkasuran/margyn/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/margyn-scan)](https://www.npmjs.com/package/margyn-scan)

Audits your test suite instead of your code.

Margyn does not review your logic. It audits the machinery that is supposed to
catch your bugs. Every finding ships a reproduction you can run. No reproduction,
no finding.

Zero dependencies. Node 22 or newer, plus git.

```bash
npx margyn-scan /path/to/repo
npx margyn-scan /path/to/repo --json
npm install -g margyn-scan   # then the command on your path is: margyn
```

Exit code is 1 when anything was found, so it works as a CI gate with no wrapper.

```
npx margyn-scan [path] [options]     # zero install
margyn [path] [options]              # once it is on your path

  path         repository to scan. Defaults to the current directory
  --mutate     run the mutation proof too. Part of Watch, so it needs a licence
  --prove      run each finding's own proof, certify what reproduces, retract the rest
  --max=<n>    how many mutations to try. Defaults to 4
  --json       print the findings as JSON instead of text
  --sarif-out=<file>    also write SARIF 2.1.0 for GitHub's Security tab
  --comment-out=<file>  also write a Markdown report for a PR comment or summary
  --version    print the version
  --help       print the usage above
```

The package is `margyn-scan` because npm refuses `margyn` as too close to an
existing package called morgan. The command it installs is `margyn`.

Site: [margyn.xyz](https://margyn.xyz). Documentation:
[margyn.xyz/docs](https://margyn.xyz/docs). Pricing:
[margyn.xyz/pricing](https://margyn.xyz/pricing).

## In GitHub Actions

```yaml
- uses: zkasuran/margyn@v0
  with:
    path: .
```

One line, pinned to a release, exit code 1 when anything was found. Inputs:
`path`, `version`, `mutate`, `max`, `json`, `comment` and `sarif`. With
`mutate: "true"` put your licence in `MARGYN_LICENCE` as a repository secret.
With `comment: "true"` the action keeps one pull-request comment updated in place
(needs `pull-requests: write`), and with `sarif: "true"` it uploads findings to the
Security tab (needs `security-events: write`). It writes a job summary every run.
It uses the job's own `GITHUB_TOKEN`, so nothing is hosted and no secret leaves
your repository. This repository's own pipeline runs that action over itself on
every push.

## Proof mode

Every finding ships a reproduction. `--prove` runs it. For each finding Margyn
executes the read-only proof its check emitted, checks the output carries the
markers the finding predicted, and marks it **reproduced**. A finding it cannot
reproduce is **retracted** and dropped, so a gate never fails your build on a
claim the tool could not show on your own tree. The mutation proof reports as
**observed**, because running your suite is how it was established.

```
npx margyn-scan . --prove

1. vendor/dist/IPool.mjs is read but git ignores it   HIGH  ignored-source  REPRODUCED
   MARGYN_ABSENT_FROM_HEAD
   MARGYN_PRESENT_ON_DISK

2 findings: 2 reproduced.
```

It is free, because a finding you can watch reproduce is the whole product.

## What it checks today

Six checks. Five are static and safe to run anywhere. The mutation proof is
opt-in behind `--mutate`, because it executes the real test suite once per
mutation.

**`ignored-source`, high.** Files the repository reads that git never committed. A
path matched by an ignore rule is absent from a clean clone, so the local run is
green because the file is sitting on your disk untracked. CI is red reading
something that was never pushed.

**`no-assertion`, high.** Tests that assert nothing. The body runs the code,
throws nothing, then reports green whatever the code returns. Assertions reached
through a local helper count, so a test whose whole body is
`expectTreeError(...)` is not reported. So does a declared count like
`t.plan(11)`, plus any helper handed the test context.

**`mutation`, high, opt-in.** The strongest evidence this tool has. It inverts a
line, runs the suite, then reports the suite that stayed green anyway. There is no
arguing with a test that passed while the thing it guards was inverted. A red
baseline aborts the run rather than producing meaningless results, each run is
timed out, then the file is restored in a `finally` block and on `SIGINT`, so an
interrupted scan cannot leave a mutated tree behind.

**`unrun-check`, medium.** Gates declared and never invoked. A `test:online` or
`verify` script that no workflow calls and no sibling script runs cannot fail. It
reads as coverage in the repository and contributes none.

**`lint-blindspot`, medium.** Linters whose exclusions come from the ignore file
rather than their own config. The exclusion is a side effect, so a path that
becomes tracked silently enters the tool's scope. That can rewrite vendored bytes
whose hash was the thing proving they came from upstream.

The mutation proof is **capped at four mutations by default**, so it under-reports
on purpose: one pass costs one full test run per mutation. Raise the cap with
`--max` to find more.

## We run it on ourselves, then we fix what it says

On 2026-08-12 this repository reported four survivors of four tried at the default
cap and seven at a cap of twelve, one of them inside the mutation checker itself.

```
bin/build-pages.mjs             === -> !==             suite still passed
bin/contrast.mjs                === -> !==             suite still passed
src/checks/ignored-source.mjs   return true -> false   suite still passed
src/checks/lint-blindspots.mjs  && -> ||               suite still passed
src/checks/mutation.mjs         return true -> false   suite still passed
src/checks/unrun-checks.mjs     !== -> ===             suite still passed
src/cli.mjs                     === -> !==             suite still passed
```

On 2026-08-15 every line on that list got a test, plus `src/prove.mjs`, which had
joined it. 63 tests became 93, and the run over every file reports this:

```
37 files tracked as source, 24 carry a mutation this tool knows how to make
24 mutated, 24 caught by the suite, 0 survivors, 14 seconds
```

Each test pins the behaviour the mutation changed rather than the mutation.
`src/cli.mjs` had no test at all, so the real binary is now run for its exit code,
its JSON and its locked-licence message. Inverted, `worker/index.mjs` refused a
licence to every customer who had paid. Nothing was watching that line.

The proof also found something no test could have covered:
`bin/build-pages.mjs` ran its build as a side effect of being imported, so a test
that imported it rebuilt the site. Under a mutated mapping it wrote
`web/public/.html` and sent every page to the wrong file. It is behind a
run-as-a-command guard now.

Zero survivors is a claim about this suite against these seven operators, not a
claim that the code is correct. A stronger operator set would find more, which is
the honest reading of any mutation score.

The paid gate is on the CLI flag rather than on the code, so a clone reproduces
this without a licence:

```bash
node --input-type=module -e 'import { mutationProof } from "./src/checks/mutation.mjs";
console.log(mutationProof(process.cwd(), { max: 60 }).map(f => f.summary));'
```

## Precision, measured

Run on 2026-08-06 against a shallow clone of each, at the commit named. Nothing
was tuned for these and nothing was left out because the number was inconvenient.

| Repository | Commit | Findings |
| --- | --- | --- |
| chalk/chalk | `661317e` | 0 |
| sindresorhus/execa | `8017b27` | 0 |
| sindresorhus/got | `e3924aa` | 1 unrun gate |
| expressjs/express | `a371447` | 3 unrun gates |
| fastify/fastify | `39e87e8` | 7 tests with no assertion, 2 that cannot fail, 4 unrun gates |

```bash
git clone --depth 1 https://github.com/fastify/fastify.git /tmp/fastify
npx margyn-scan /tmp/fastify
```

`ignored-source` found nothing on any of the five and it could not have: it
reports a file that is on disk and not in the commit, which cannot exist in a
fresh clone. It fires on a working tree, which is where the defect below lived.

**That run reported 17 on fastify before it reported 10.** Seven findings in
`test/trust-proxy.test.js` were wrong: the tests declare `t.plan(11)` then assert
through a helper. A scanner that cries wolf is hollow itself, so both rules went
into the check and both directions are tested. The full before and after is at
[margyn.xyz/proof](https://margyn.xyz/proof).

An earlier run took five other repositories from 132, 51, 20, 6 and 12 findings to
0, 2, 2, 2 and 0 after four matching fixes. That is a true story about how the
rules were built. It is also the weakest number here, because those repositories
were never written down.

## Proof it catches a real failure

The first two checks were written from a defect that made a real pull request go
red on 2026-08-01, in `nishuzumi/moss` PR #157.

Eight vendored modules lived under a path containing `dist/`. The root
`.gitignore` ignores `dist/` at any depth, so every one was silently dropped
from the commit while sitting on disk untracked. Locally: 26 tests green. In CI:
two tests failed reading files that had never been pushed. The diff was innocent.
The absence was the bug. No diff reviewer could have seen it.

Reconstructed against that exact commit, Margyn returns:

```
1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by
   packages/protocols/aave/README.md but git ignores it, so it is not in the commit
   HIGH  ignored-source     ignore rule: .gitignore:2:dist/
2. packages/protocols/aave/abis-src/dist/abis/IPool.mjs is read by
   packages/protocols/aave/abis-src/VENDOR.json but git ignores it
   HIGH  ignored-source     ignore rule: .gitignore:2:dist/
```

Both reproductions run and confirm it:

```
$ git archive HEAD | tar -t | grep -qE '(^|/)<the path the reader asks for>$' \
    || echo 'NOTHING in HEAD answers <path>'
NOTHING in HEAD answers dist/abis/IPool.mjs
$ test -f '<path>' && echo 'PRESENT on disk'
PRESENT on disk
```

Run against the fixed tree, the two high findings are gone and only the two
medium advisories remain. A checker that cannot be shown to go quiet is as
useless as the hollow checks it hunts, so that direction is tested too.

## Paying for it, plus why the check works offline

The static checks are free and always will be. The mutation proof is part of
**Watch**, $8.99 a month with three days free, because it is the check that costs
real machine time: it edits your tree and runs your suite once per mutation.

Or have the findings arrive already fixed. **Solo Fix** is $19 a month for one
finding fixed, **Fix flow** is $79 a month for three, each returned as a patch
carrying a test that fails before it and passes after. It works from the finding,
not your repository, so it needs no token that can read your source. Send one at
[margyn.xyz/fix](https://margyn.xyz/fix); it takes a paste, and the code snippet a
finding sometimes carries never travels.

The scanner runs on your machine, so your machine decides whether that check is
unlocked. It never calls home. A licence check that needs the network is a new way
for a build to go red for reasons that have nothing to do with the code. A CI
runner on a private network would fail it every time.

So the server signs a short licence with Ed25519 and the CLI verifies it against a
public key compiled into the source:

```bash
export MARGYN_LICENCE=$(cat licence.txt)   # or ~/.margyn/licence
npx margyn-scan /path/to/repo --mutate
```

A refusal never fails your run. Ask for a paid check without a licence and you are
told why, then the free scan runs in full and exits on its own findings. Billing is
not a reason to break someone's build.

A tampered licence cannot be made to work: the signature covers the payload, so
editing the product name or the expiry invalidates it. Forging one would need a
private key that is not in this repository. `test/licence.test.mjs` proves both
attacks fail using signatures made by the real signer.

## The site

`margyn.xyz` is one static page per module in `web/pages`, built through one shell
in `web/layout.mjs`, then bundled into the Worker script. `npm run pages`
regenerates them along with `sitemap.xml` and `robots.txt`, and
`test/pages.test.mjs` fails if the built HTML drifts from its module or if any
internal link stops resolving.

```bash
npm run dev             # local, http://localhost:3000
npm run worker:deploy   # build the pages, bundle them, deploy
```

`worker/index.mjs` serves `/api/config`, `/api/verify`, `/api/licence`, `/api/fix-intake` plus `/api/suggest`. The last two validate a form, answer with a prefilled GitHub issue link and store nothing.
**There is no `/api/scan` on the deployed worker.** The local server has one,
because there the caller and the repository are the same machine. On a public host
that route would take a filesystem path from a stranger and run git against it,
which is a filesystem probe wearing a product's clothes. Your code never leaves
your machine, which is also why the licence is verified offline.

Secrets are set once per environment and never committed:

```bash
npx wrangler secret put TIUN_SANDBOX_API_KEY
npx wrangler secret put MARGYN_LICENCE_KEY
```

The Worker signs with WebCrypto and the local server signs with `node:crypto`.
Ed25519 is deterministic, so the same payload and key give the same bytes, and
`test/worker.test.mjs` asserts the two tokens are identical rather than merely
both valid. A licence therefore works the same whichever host issued it.

## Tests

```bash
npm test
```

Sixty-three tests, no dependencies. The check tests each build a real git repository
in a temp directory, plant exactly one defect, assert the check finds it, then
plant the fixed shape and assert the check stays silent. Proof mode is tested the
same way, including that it retracts a finding it cannot reproduce. The licence tests
carry real signatures from the production key and prove that a flipped signature byte, a
payload swapped under a real signature, an expired licence and a licence for the
wrong product are all refused with the reason named.

## Not done yet

- Assertions that cannot fail for a subtler reason than having none, for example
  a fixture hash written by hand instead of generated. We hit exactly this on
  2026-08-01 and it is not automated yet.
- Local versus CI environment divergence.
- Generating the patch automatically. Fix flow does it as a service today, by a
  person working from the finding; the CLI still only names the defect.

MIT licensed. Every number in this file was measured on the shipped product rather
than estimated.
