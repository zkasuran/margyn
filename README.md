# Margyn

Proves your checks do not check anything.

Margyn does not review your code. It audits the machinery that is supposed to
catch your bugs, and it reports only what it can prove. Every finding ships a
reproduction you can run. No reproduction, no finding.

Zero dependencies. Node 22 or newer, and git.

```bash
node src/cli.mjs /path/to/repo
node src/cli.mjs /path/to/repo --json
```

Exit code is 1 when anything was found, so it works as a CI gate.

## What it checks today

Five checks. Three are static and safe to run anywhere; the mutation proof is
opt-in behind `--mutate` because it executes the real test suite once per
mutation.

**`ignored-source`, high.** Files the repository reads that git never
committed. A path matched by an ignore rule is absent from a clean clone, so the
local run is green because the file is sitting on your disk untracked, and CI is
red reading something that was never pushed.

**`unrun-check`, medium.** Gates declared and never invoked. A `test:online` or
`verify` script that no workflow calls and no sibling script runs cannot fail. It
reads as coverage in the repository and contributes none.

**`lint-blindspot`, medium.** Linters whose exclusions come from the ignore file
rather than their own config. The exclusion is a side effect, so a path that
becomes tracked silently enters the tool's scope. That can rewrite vendored bytes
whose hash was the thing proving they came from upstream.

**`no-assertion`, high.** Tests that assert nothing. The body runs the code,
throws nothing, and reports green whatever the code returns. Assertions reached
through a local helper count, so a test whose whole body is
`expectTreeError(...)` is not reported.

**`mutation`, high, opt-in.** The strongest evidence this tool has. It inverts a
line, runs the suite, and reports the suite that stayed green anyway. There is no
arguing with a test that passed while the thing it guards was inverted. A red
baseline aborts the run rather than producing meaningless results, mutations are
capped, each run is timed out, and the file is restored in a `finally` block and
on `SIGINT`, so an interrupted scan cannot leave a mutated tree behind.

## Precision, measured

A scanner that cries wolf is hollow itself, so false positives were treated as
defects. First run across five real repositories produced 132 findings on one of
them, nearly all noise. Four fixes:

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
0. The remaining findings are true: an unrun `lint:fix`, and biome inheriting its
exclusions from `.gitignore`.

The true positive still fires. Reconstructed against moss `c6cbb45` it reports
both vendored modules with the correct reader, `scripts/abis.ts`.

## Proof it catches a real failure

The first two checks were written from a defect that made a real pull request go
red on 2026-08-01, in `nishuzumi/moss` PR #157.

Eight vendored modules lived under a path containing `dist/`. The root
`.gitignore` ignores `dist/` at any depth, so every one was silently dropped
from the commit while sitting on disk untracked. Locally: 26 tests green. In CI:
two tests failed reading files that had never been pushed. The diff was
innocent, the absence was the bug, and no diff reviewer could have seen it.

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

## Paying for it, and why the check works offline

The static checks are free and always will be. The mutation proof is part of
**Watch**, because it is the check that costs real machine time: it edits your
tree and runs your suite once per mutation.

The scanner runs on your machine, so your machine decides whether that check is
unlocked. It never calls home. A licence check that needs the network is a new way
for a build to go red for reasons that have nothing to do with the code. A CI
runner on a private network would fail it every time.

So the server signs a short licence with Ed25519 and the CLI verifies it against a
public key compiled into the binary:

```bash
export MARGYN_LICENCE=$(cat licence.txt)   # or ~/.margyn/licence
margyn /path/to/repo --mutate
```

A refusal never fails your run. Ask for a paid check without a licence and you are
told why, then the free scan runs in full and exits on its own findings. Billing is
not a reason to break someone's build.

A tampered licence cannot be made to work: the signature covers the payload, so
editing the product name or the expiry invalidates it, and forging one would need a
private key that is not in this repository. `test/licence.test.mjs` proves both
attacks fail using signatures made by the real signer.

## Tests

```bash
npm test
```

Twenty-one tests, no dependencies. The check tests each build a real git
repository in a temp directory, plant exactly one defect, assert the check finds
it, then plant the fixed shape and assert the check stays silent. The licence
tests carry real signatures from the production key and prove that a flipped
signature byte, a payload swapped under a real signature, an expired licence and a
licence for the wrong product are all refused with the reason named.

## Not done yet

- Assertions that cannot fail for a subtler reason than having none, for example
  a fixture hash written by hand instead of generated. We hit exactly this on
  2026-08-01 and it is not automated yet.
- Local versus CI environment divergence.
- Fix pack: generating the patch, not just naming the defect.
