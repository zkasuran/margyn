# Placebo

Proves your checks do not check anything.

Placebo does not review your code. It audits the machinery that is supposed to
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

A scanner that cries wolf is itself a placebo, so false positives were treated as
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

Reconstructed against that exact commit, Placebo returns:

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

## Tests

```bash
npm test
```

Six tests, no dependencies. Each one builds a real git repository in a temp
directory, plants exactly one defect, asserts the check finds it, then plants the
fixed shape and asserts the check stays silent.

## Not done yet

- Mutation proof: break a line on purpose and report the tests that stayed
  green. That is the strongest evidence form and it is the next check.
- Assertions that cannot fail, for example a fixture hash written by hand
  instead of generated. We hit exactly this on 2026-08-01 and it is not
  automated yet.
- Local versus CI environment divergence.
- The hosted product: auth, checkout and the dashboard, built Tiun-native.
