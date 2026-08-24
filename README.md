<div align="center">

# Margyn

**Your tests pass. That is not the same as working.**

[![CI](https://github.com/zkasuran/margyn/actions/workflows/ci.yml/badge.svg)](https://github.com/zkasuran/margyn/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/margyn-scan?color=0F5C4E&label=npm)](https://www.npmjs.com/package/margyn-scan)
[![license](https://img.shields.io/badge/license-MIT-1F6B4A)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A522-17181C)](https://nodejs.org)
[![zero deps](https://img.shields.io/badge/dependencies-0-686A72)](./package.json)

Audits the machinery that is supposed to catch your bugs.  
Every finding ships a reproduction you can run. No reproduction, no finding.

[Website](https://margyn.xyz) · [Documentation](https://margyn.xyz/docs) · [Pricing](https://margyn.xyz/pricing) · [Proof](https://margyn.xyz/proof)

</div>

---

## Quick Start

```bash
npx margyn-scan /path/to/repo
```

That's it. Node 22, git, no account, no config file, nothing uploaded.

```bash
npx margyn-scan /path/to/repo --json   # JSON output
npm install -g margyn-scan              # then: margyn /path/to/repo
```

Exit code is **1** when anything was found — it works as a CI gate with no wrapper.

---

## What It Finds

Margyn does not review your logic. It audits the verification layer — the tests, the gates, the things you assume are watching. Three ways a green pipeline lies to you:

| Problem | What happens |
| :--- | :--- |
| **A file the build reads is not in the commit** | Your machine has it untracked, CI fails on a file nobody removed. The diff looks innocent because the defect is an absence. |
| **A test that asserts nothing** | It runs the code, throws nothing, reports green whatever came back. It counts toward coverage and guards nothing. |
| **A gate nobody invokes** | A `verify` or `test:online` script sits in the manifest, reads as coverage to every reviewer, never fails because no workflow calls it. |

All three are invisible to a code reviewer, to a coverage percentage, and to an AI that reads the diff.

---

## The Six Checks

| Check | Severity | What it catches |
| :--- | :---: | :--- |
| `ignored-source` | 🔴 high | Files the repo reads that git never committed — absent from a clean clone |
| `no-assertion` | 🔴 high | Tests that assert nothing: run code, throw nothing, report green |
| `cannot-fail` | 🔴 high | Tests whose only assertion is that an error was thrown, called on code that cannot throw |
| `unrun-check` | 🟡 medium | Gates declared in package.json that no workflow invokes |
| `lint-blindspot` | 🟡 medium | Linter exclusions from the ignore file rather than the tool's own config |
| `mutation` | 🔴 high | Lines the suite stays green after inverting — the mutation proof (paid) |

The first five are static, safe to run anywhere, and **free forever**. The mutation proof is opt-in behind `--mutate` because it executes your real test suite.

---

## Proof Mode

Every finding ships a reproduction. `--prove` runs it:

```
npx margyn-scan . --prove

1. vendor/dist/IPool.mjs is read but git ignores it   HIGH  ignored-source  REPRODUCED
   MARGYN_ABSENT_FROM_HEAD
   MARGYN_PRESENT_ON_DISK

2 findings: 2 reproduced.
```

A finding that cannot be reproduced is **retracted** and dropped. A gate never fails your build on a claim the tool cannot show on your own tree.

---

## Usage

```
npx margyn-scan [path] [options]     # zero install
margyn [path] [options]              # once it is on your path

  path         repository to scan (defaults to current directory)
  --mutate     run the mutation proof (needs a licence)
  --prove      run each finding's own proof, retract what can't reproduce
  --max=<n>    how many mutations to try (default: 4)
  --json       print findings as JSON
  --sarif-out=<file>    write SARIF 2.1.0 for GitHub's Security tab
  --comment-out=<file>  write Markdown report for a PR comment
  --version    print the version
  --help       print usage
```

---

## GitHub Actions

```yaml
- uses: zkasuran/margyn@v0
  with:
    path: .
```

One line, pinned to a release, exit code 1 when anything was found.

<details>
<summary><b>All inputs and options</b></summary>

| Input | Default | Description |
| :--- | :---: | :--- |
| `path` | `.` | Repository path to scan |
| `version` | latest | Pin a specific version |
| `mutate` | `"false"` | Run the mutation proof (needs `MARGYN_LICENCE` secret) |
| `max` | `4` | Mutation cap |
| `json` | `"false"` | Output as JSON |
| `comment` | `"false"` | Post/update a PR comment (needs `pull-requests: write`) |
| `sarif` | `"false"` | Upload to Security tab (needs `security-events: write`) |

The action uses the job's own `GITHUB_TOKEN`. Nothing is hosted and no secret leaves your repository.

</details>

---

## Precision, Measured

Run on 2026-08-06 against a shallow clone of each, at the commit named. Nothing was tuned for these and nothing was left out:

| Repository | Commit | Findings |
| :--- | :---: | :--- |
| chalk/chalk | `661317e` | 0 |
| sindresorhus/execa | `8017b27` | 0 |
| sindresorhus/got | `e3924aa` | 1 unrun gate |
| expressjs/express | `a371447` | 3 unrun gates |
| fastify/fastify | `39e87e8` | 7 no-assertion, 2 cannot-fail, 4 unrun gates |

```bash
git clone --depth 1 https://github.com/fastify/fastify.git /tmp/fastify
npx margyn-scan /tmp/fastify
```

> **That run reported 17 on fastify before it reported 10.** Seven findings were wrong: the tests declare `t.plan(11)` then assert through a helper. Both rules were fixed, both directions are tested. The full before-and-after is at [margyn.xyz/proof](https://margyn.xyz/proof).

---

## We Run It On Ourselves

On 2026-08-17, measured over everything in scope:

```
40 files tracked as source, 27 carry a mutation this tool knows how to make
27 mutated, 27 caught by the suite, 0 survivors, 208 seconds
108 tests, 0 failing
```

<details>
<summary><b>What we caught and fixed</b></summary>

On 2026-08-12 this repository reported seven survivors at a cap of twelve, one inside the mutation checker itself:

```
bin/build-pages.mjs             === -> !==    suite still passed
bin/contrast.mjs                === -> !==    suite still passed
src/checks/ignored-source.mjs   return true -> false   suite still passed
src/checks/lint-blindspots.mjs  && -> ||     suite still passed
src/checks/mutation.mjs         return true -> false   suite still passed
src/checks/unrun-checks.mjs     !== -> ===   suite still passed
src/cli.mjs                     === -> !==   suite still passed
```

Every line got a test. 63 tests became 108. Zero survivors.

The proof also found something no test could have covered: `bin/build-pages.mjs` ran its build as a side effect of being imported, so a test that imported it rebuilt the site. Under a mutation it wrote every page to the wrong file. It is behind a run-as-a-command guard now.

</details>

Reproduce it without a licence:

```bash
node --input-type=module -e 'import { mutationProof } from "./src/checks/mutation.mjs";
console.log(mutationProof(process.cwd(), { max: 60 }).map(f => f.summary));'
```

---

## Proof It Catches a Real Failure

Written from [nishuzumi/moss PR #157](https://github.com/nishuzumi/moss/pull/157), 2026-08-01.

Eight vendored modules lived under `dist/`. The root `.gitignore` excludes `dist/` at any depth — every file was silently dropped from the commit. Locally: 26 tests green. In CI: two tests failed reading files that had never been pushed. **The diff was innocent. The absence was the bug.**

```
1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by
   packages/protocols/aave/README.md but git ignores it
   HIGH  ignored-source     ignore rule: .gitignore:2:dist/
2. packages/protocols/aave/abis-src/dist/abis/IPool.mjs is read by
   packages/protocols/aave/abis-src/VENDOR.json but git ignores it
   HIGH  ignored-source     ignore rule: .gitignore:2:dist/
```

---

## Paying For It

| Plan | Price | What you get |
| :--- | :---: | :--- |
| **Free scan** | $0 forever | Five static checks, no account, no licence, no network |
| **Watch** | $8.99/mo | Adds the mutation proof + offline licence for CI |
| **Team** | $29/mo | Watch for every org repository, priority support |
| **Solo Fix** | $19/mo | One finding fixed for you, as a patch with a test |
| **Fix flow** | $79/mo | Three findings fixed per month |

The scanner runs on your machine and never calls home. A licence check that needs the network is a new way for a build to go red for reasons that have nothing to do with the code.

```bash
export MARGYN_LICENCE=$(cat licence.txt)   # or ~/.margyn/licence
npx margyn-scan /path/to/repo --mutate
```

A refusal never fails your run — it tells you why, then the free scan runs in full.

---

## The Site

`margyn.xyz` is one static page per module in `web/pages/`, built through one shell in `web/layout.mjs`, then bundled into a Cloudflare Worker.

```bash
npm run dev              # local development, http://localhost:3000
npm run build            # build pages + bundle for the worker
npm run worker:deploy    # build and deploy
```

The Worker serves `/api/config`, `/api/verify`, `/api/licence`, `/api/fix-intake` and `/api/suggest`. **There is no `/api/scan` on the deployed worker** — your code never leaves your machine.

---

## Tests

```bash
npm test
```

108 tests, no dependencies. Each check test builds a real git repository in a temp directory, plants one defect, asserts the check finds it, then plants the fixed shape and asserts silence. The licence tests carry real signatures and prove that a flipped byte, a swapped payload, an expired licence, and a wrong-product licence are all refused with the reason named.

---

## Not Done Yet

- Assertions that cannot fail for subtler reasons (e.g. a fixture hash written by hand instead of generated)
- Local vs CI environment divergence detection
- Generating the patch automatically (Fix flow does it as a service today)

---

<div align="center">

MIT licensed · Built by **Asura Coding Works**

Every number in this file was measured on the shipped product rather than estimated.

</div>
