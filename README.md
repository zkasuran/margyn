# Margyn

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
  --max=<n>    how many mutations to try. Defaults to 4
  --json       print the findings as JSON instead of text
  --version    print the version
  --help       print the usage above
```

The package is `margyn-scan` because npm refuses `margyn` as too close to an
existing package called morgan. The command it installs is `margyn`.

Site: [margyn.xyz](https://margyn.xyz). Documentation:
[margyn.xyz/docs](https://margyn.xyz/docs). Pricing:
[margyn.xyz/pricing](https://margyn.xyz/pricing).

## What it checks today

Five checks. Four are static and safe to run anywhere. The mutation proof is
opt-in behind `--mutate`, because it executes the real test suite once per
mutation.

**`ignored-source`, high.** Files the repository reads that git never committed. A
path matched by an ignore rule is absent from a clean clone, so the local run is
green because the file is sitting on your disk untracked. CI is red reading
something that was never pushed.

**`no-assertion`, high.** Tests that assert nothing. The body runs the code,
throws nothing, then reports green whatever the code returns. Assertions reached
through a local helper count, so a test whose whole body is
`expectTreeError(...)` is not reported.

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

## We run it on ourselves

Pointed at this repository at the default cap of four, all four mutations
survived. Raise the cap to twelve and six do.

```
bin/build-pages.mjs            === -> !==             suite still passed
bin/contrast.mjs               === -> !==             suite still passed
src/checks/ignored-source.mjs  return true -> false   suite still passed
src/checks/mutation.mjs        return true -> false   suite still passed
```

The last one is the mutation checker. Our own tool inverted a line inside our own
mutation checker and 41 tests reported success. We publish the number rather than
the cap that flatters it.

The paid gate is on the CLI flag rather than on the code, so a clone reproduces
this without a licence:

```bash
node --input-type=module -e 'import { mutationProof } from "./src/checks/mutation.mjs";
console.log(mutationProof(process.cwd(), { max: 12 }).map(f => f.summary));'
```

## Precision, measured

A scanner that cries wolf is hollow itself, so false positives were treated as
defects. The first run across five real repositories produced 132 findings on one
of them, nearly all noise. Four fixes:

- A `package.json` declaring its own build output in `main` or `exports` is not
  reading it. Only source code counts as a reader.
- Matching on a bare basename reported every `dist/index.js` in a monorepo.
  Matching now needs a path suffix carrying at least one parent directory, which
  is how the real defect was found in the first place: `dist/abis/IPool.mjs`.
- Dependency trees an install step fetches, `forge install` into
  `contracts/lib`, are ignored on purpose and recreated on demand. Detected by a
  manifest of their own inside an untracked ancestor.
- A sibling script calling a gate as `pnpm check:web` counts as running it.

Result on the same five repositories: 132 to 0, 51 to 2, 20 to 2, 6 to 2, 12 to
0. The remaining findings are true: an unrun `lint:fix`, plus biome inheriting its
exclusions from `.gitignore`.

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
$ git archive HEAD | tar -t | grep -qx '<path>' || echo 'ABSENT from HEAD'
ABSENT from HEAD
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

`margyn.xyz` is eight static pages built from `web/pages/*.mjs` through one shell
in `web/layout.mjs`, then bundled into the Worker script. `npm run pages`
regenerates them along with `sitemap.xml` and `robots.txt`, and
`test/pages.test.mjs` fails if the built HTML drifts from its module or if any
internal link stops resolving.

```bash
npm run dev             # local, http://localhost:3000
npm run worker:deploy   # build the pages, bundle them, deploy
```

`worker/index.mjs` serves `/api/config`, `/api/verify` and `/api/licence`.
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

Forty-one tests, no dependencies. The check tests each build a real git repository
in a temp directory, plant exactly one defect, assert the check finds it, then
plant the fixed shape and assert the check stays silent. The licence tests carry
real signatures from the production key and prove that a flipped signature byte, a
payload swapped under a real signature, an expired licence and a licence for the
wrong product are all refused with the reason named.

## Not done yet

- Assertions that cannot fail for a subtler reason than having none, for example
  a fixture hash written by hand instead of generated. We hit exactly this on
  2026-08-01 and it is not automated yet.
- Local versus CI environment divergence.
- Generating the patch, not just naming the defect.

MIT licensed. Every number in this file was measured on the shipped product rather
than estimated.
