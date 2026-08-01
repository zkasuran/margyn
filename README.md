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
