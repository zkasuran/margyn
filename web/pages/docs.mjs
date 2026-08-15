/** Documentation. Everything a paying user needs, in the order they need it. */
export default {
  path: "/docs",
  title: "Margyn documentation: install, the five checks, CI and licences",
  ogTitle: "How to run Margyn, plus what each check actually looks for",
  description:
    "Install with npx, read the output, wire it into CI, then see exactly what fires each of the five checks and what deliberately does not.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Documentation</h1>
  <p class="lede prose">One command, five checks, no configuration file. This page covers what each
    check looks for, what it deliberately ignores, how the paid check is unlocked and how to make
    the whole thing a gate in CI.</p>
</div></section>

<div class="wrap"><div class="doc">
  <nav class="toc" aria-label="On this page">
    <p>Contents</p>
    <a href="#requirements">Requirements</a>
    <a href="#install">Install</a>
    <a href="#usage">Usage</a>
    <a href="#output">Reading the output</a>
    <a href="#checks">The five checks</a>
    <a href="#mutate">The mutation proof</a>
    <a href="#licence">Licences</a>
    <a href="#ci">In CI</a>
    <a href="#json">JSON output</a>
    <a href="#nothing">When it finds nothing</a>
  </nav>
  <div class="docbody">

<h2 id="requirements">Requirements</h2>
<ul>
  <li>Node 22 or newer. Nothing older, because the code uses what 22 ships.</li>
  <li><code>git</code> on the path, plus a real git repository. Every check starts from
    <code>git ls-files</code>, so a plain directory returns nothing rather than guessing.</li>
  <li>No configuration file, no API key, no account for the free checks.</li>
</ul>
<p>Zero runtime dependencies. The whole scanner is one directory of ES modules, so an install
  cannot break your tree and there is no transitive package to audit.</p>

<h2 id="install">Install</h2>
<p>There is nothing to install. This is the whole quickstart:</p>
<pre tabindex="0" role="group" aria-label="Running Margyn with npx">npx margyn-scan /path/to/repo</pre>
<p>If you would rather have it on the path or pinned in a repository:</p>
<pre tabindex="0" role="group" aria-label="Installing Margyn">npm install -g margyn-scan     # then the command on your path is: margyn
npm install -D margyn-scan     # then, inside that repo: npx margyn .</pre>
<p>The package is <code>margyn-scan</code> because npm refuses the name
  <code>margyn</code> as too close to an existing package called morgan. The command it installs
  is <code>margyn</code>, so the tool and the command agree even though the package name has to
  carry a suffix.</p>

<h2 id="usage">Usage</h2>
<pre tabindex="0" role="group" aria-label="Command line options">npx margyn-scan [path] [options]     # zero install
margyn [path] [options]              # once it is on your path

  path         repository to scan. Defaults to the current directory
  --mutate     run the mutation proof too. Part of Watch, so it needs a licence
  --prove      run each finding's own proof, certify what reproduces, retract the rest
  --max=&lt;n&gt;    how many mutations to try. Defaults to 4
  --json       print the findings as JSON instead of text
  --sarif-out=&lt;file&gt;    also write SARIF 2.1.0 for GitHub's Security tab
  --comment-out=&lt;file&gt;  also write a Markdown report for a PR comment or summary
  --version    print the version
  --help       print the usage above</pre>
<p><strong>Exit code is 1 when anything was found</strong> and 0 when nothing was. That is the whole
  CI contract, so no wrapper script is needed. An invalid <code>--max</code> exits 2 rather than
  quietly falling back to the default, because a typo that scans four files while you believe it
  scanned forty is the same class of defect this tool reports.</p>

<h2 id="prove">Proof mode</h2>
<p>Every finding already ships a reproduction. <code>--prove</code> runs it for you. For each
  finding Margyn executes the read-only proof its check emitted, checks the output carries the
  markers the finding predicted, and labels it <b>reproduced</b>. A finding it cannot reproduce is
  <b>retracted</b> and dropped, so a gate never fails your build on a claim the tool could not show
  on your own tree. The mutation proof is reported as <b>observed</b>, because it was already
  established by running your suite. It is free: it makes a finding undeniable, which is the whole
  product.</p>
<pre tabindex="0" role="group" aria-label="Proof mode">npx margyn-scan . --prove

1. vendor/dist/IPool.mjs is read but git ignores it   <span class="r">HIGH</span>  ignored-source  <b>REPRODUCED</b>
   MARGYN_ABSENT_FROM_HEAD
   MARGYN_PRESENT_ON_DISK

2 findings: 2 reproduced.</pre>

<h2 id="output">Reading the output</h2>
<pre tabindex="0" role="group" aria-label="Anatomy of a finding"><b>margyn /tmp/moss</b>

2 findings, each with a reproduction you can run.

<b>1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by</b>
<b>   packages/protocols/aave/README.md but git ignores it</b>
   <span class="r">HIGH</span>  <span class="d">ignored-source</span>  packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs
   <span class="d">ignore rule: .gitignore:2:dist/</span>
   <span class="d">why:</span> A clean clone or a CI runner cannot read this file.
   <span class="d">reproduce:</span>
     git -C . archive HEAD | tar -t | grep -qx '&lt;path&gt;' || echo 'ABSENT from HEAD'
     test -f '&lt;path&gt;' &amp;&amp; echo 'PRESENT on disk'</pre>
<p>Six parts, in this order: the summary, the severity, the check that fired, the file, the evidence
  the check based it on, why it matters, then the reproduction. The reproduction is the part that
  makes it a finding rather than an opinion. A finding that cannot carry one is dropped instead of
  printed, so the count you see is smaller than the count we could have printed.</p>
<p>Findings are sorted with high first. Severity is a word, never a colour on its own, so the output
  survives being piped into a file or read by someone who does not see red.</p>

<h2 id="checks">The five checks</h2>
<p>Each one says what fires it and what does not, because a scanner you cannot predict gets
  uninstalled. The precision rules below are not tuning knobs, they are fixes for false positives we
  produced and treated as defects.</p>

<h3 id="ignored-source">ignored-source <span class="sev high">high</span></h3>
<p><strong>Fires when</strong> a file on disk is excluded by an ignore rule, is not tracked by git,
  and some tracked source file mentions its path. Then a clean clone cannot read it, so your green
  local run and a red CI run are both correct.</p>
<p><strong>Does not fire when:</strong></p>
<ul>
  <li>The mention comes from a <code>package.json</code> naming its own build output in
    <code>main</code>, <code>exports</code> or <code>bin</code>. Declaring your output is not reading
    it, so only real source counts as a reader.</li>
  <li>Something in the commit answers the path the reader asks for. An asset committed at
    <code>web/public/tour/clip.webm</code> satisfies <code>src="/tour/clip.webm"</code>, so the copy
    your build left in <code>web/dist</code> is not missing source. Every path a reader names is
    collected and only one that nothing commits is reported.</li>
  <li>The file sits under output a tool in this repository declares it writes: <code>out</code> in
    <code>foundry.toml</code>, a <code>vite build</code> or <code>next build</code> or
    <code>cargo build</code> in the script that runs it, an <code>outdir</code> in a build script, an
    <code>outDir</code> in a <code>tsconfig</code>. A clean clone plus that build has the file. The
    rule reads declarations and resolves them to real paths, never the directory being called
    <code>dist</code>: the defect this check was written from was vendored source in
    <code>vendor/dist</code>, which no tool declares, and that one still fires.</li>
  <li>The match is only a bare filename. A path suffix carrying at least one parent directory is
    required, otherwise every <code>dist/index.js</code> in a monorepo gets reported. The real defect
    this check was written from still matches, because it was found by three segments:
    <code>dist/abis/IPool.mjs</code>.</li>
  <li>The file sits inside a dependency tree an install step fetches, for example
    <code>forge install</code> into <code>contracts/lib</code>. Those are ignored on purpose and
    recreated on demand. Detected by a manifest of their own inside an untracked ancestor.</li>
  <li>Nothing references the file at all. An ignored build artefact is not a defect.</li>
</ul>
<p>The evidence names the rule and the line, for example <code>.gitignore:2:dist/</code>, so you can
  fix the rule rather than hunt for it.</p>

<h3 id="no-assertion">no-assertion <span class="sev high">high</span></h3>
<p><strong>Fires when</strong> a <code>test(...)</code> or <code>it(...)</code> call contains no
  assertion anywhere in its span. That test runs your code, throws nothing, then reports green
  whatever the code returned.</p>
<p><strong>Does not fire when:</strong></p>
<ul>
  <li>The assertion is reached through a helper. Any identifier containing expect or assert counts,
    so a test whose whole body is <code>expectTreeError(...)</code> is left alone.</li>
  <li>A helper is handed the test context, for example
    <code>checkRequestValues(t, req, { ip })</code>. The assertion lives in the helper and the helper
    needs the context to make it, so this is the same rule as above without depending on the
    helper's name.</li>
  <li>The body declares an assertion count. <code>t.plan(11)</code> fails the test when the count
    comes up short, in node:test, tap, tape and ava alike, so a body carrying one cannot be
    hollow.</li>
  <li>The file is a type level test. <code>@ts-expect-error</code>,
    <code>expectTypeOf</code>, <code>assertType</code> or <code>satisfies</code> anywhere in the file
    means the checking happens at compile time.</li>
  <li>The body is too small to be doing anything, under 24 non-space characters.</li>
</ul>
<p>The whole balanced parenthesis span of the call is searched rather than a guess at where the
  callback body starts, because <code>it("x", { timeout: 1 }, fn)</code> puts an options object
  exactly where a naive parser looks for the body and would report every timed test.</p>
<p>The middle two rules came from running this check over fastify, where seven tests in one file were
  reported and every one of them was wrong. <a href="/proof#public">That run is on the proof
  page</a>, before and after.</p>

<h3 id="unrun-check">unrun-check <span class="sev med">medium</span></h3>
<p><strong>Fires when</strong> a script whose name starts with test, lint, typecheck, check, verify,
  audit or e2e is declared in a <code>package.json</code> and no workflow file mentions it and no
  sibling script calls it. It reads as coverage in the repository and it cannot fail.</p>
<p><strong>Does not fire when:</strong></p>
<ul>
  <li>There is no <code>.github/workflows</code> directory at all. With no CI to compare against,
    "nothing invokes it" would be true of every script and the check would be noise.</li>
  <li>A sibling script mentions it, however your package manager spells it. <code>pnpm check:web</code>,
    <code>npm run check:web</code> and <code>turbo run check:web</code> all count.</li>
  <li>It is an npm lifecycle script such as <code>prepare</code> or <code>postinstall</code>. npm runs
    those itself, so absence from CI proves nothing.</li>
</ul>
<p>Workspaces are covered: <code>packages</code>, <code>apps</code> and <code>examples</code> are
  scanned one and two levels deep.</p>

<h3 id="lint-blindspot">lint-blindspot <span class="sev med">medium</span></h3>
<p><strong>Fires when</strong> a linter or formatter config takes its exclusions from the ignore file
  rather than from its own config. Today that is biome's <code>useIgnoreFile</code> and any
  <code>ignorePath</code>, in <code>biome.json</code>, <code>biome.jsonc</code>,
  <code>.eslintrc.json</code>, <code>eslint.config.js</code> or <code>.prettierrc</code>.</p>
<p>The exclusion is then a side effect. A path that becomes tracked silently enters the tool's scope,
  which can rewrite vendored bytes whose hash was the thing proving they came from upstream. That is
  not hypothetical: it is the second half of the failure this product was written from.</p>

<h3 id="mutation">mutation <span class="sev high">high</span> <span class="paid">part of Watch</span></h3>
<p><strong>Fires when</strong> a line is inverted, your whole suite runs, then it passes anyway. There
  is no arguing with a test that passed while the thing it guards was inverted. Details in the next
  section.</p>

<h2 id="mutate">The mutation proof</h2>
<pre tabindex="0" role="group" aria-label="Running the mutation proof">npx margyn-scan . --mutate            # four mutations, the default
npx margyn-scan . --mutate --max=12   # more mutations, more full test runs</pre>
<p>How a candidate is picked, in order:</p>
<ol>
  <li>Your suite must pass unmutated. If the baseline is red the check aborts and says so, because a
    mutation result against a red suite means nothing.</li>
  <li>Candidates come from <code>git ls-files</code>, filtered to <code>.js</code>,
    <code>.mjs</code>, <code>.ts</code> and <code>.mts</code>, skipping tests, type declarations,
    <code>dist</code>, <code>node_modules</code> and anything that looks like a fixture.</li>
  <li>The first mutation that applies to the file is used, from this list:
    <code>return true</code> to <code>false</code>, <code>return false</code> to <code>true</code>,
    <code>===</code> to <code>!==</code>, <code>!==</code> to <code>===</code>, <code>&gt;=</code> to
    <code>&lt;</code>, <code>&lt;=</code> to <code>&gt;</code>, <code>&amp;&amp;</code> to
    <code>||</code>. Each one inverts meaning without changing shape, so nothing fails to parse.</li>
  <li>The suite runs again. If it passes, that is a finding.</li>
</ol>
<p>The test command is whatever the scanned repository declares, run as <code>npm test --silent</code>.
  A repository with no test script gets no mutation findings rather than a guess. Each run is timed
  out at three minutes. The file is restored in a <code>finally</code> block and on
  <code>SIGINT</code>.</p>
<p><strong>We never print a mutation score.</strong> The output is the surviving line and the command
  that reproduces it. If a score across a whole codebase is what you want, that is
  <a href="https://stryker-mutator.io/">Stryker</a>, free and better at it than we are.</p>

<h2 id="licence">Licences</h2>
<p>Buy Watch, sign in, then press <em>Get my licence</em> in the top bar. You are handed one line of
  text. The CLI looks for it in two places, environment first so CI can inject it as a secret:</p>
<pre tabindex="0" role="group" aria-label="Where the CLI looks for a licence">export MARGYN_LICENCE='&lt;the line&gt;'      # or MARGYN_LICENSE, both are read
~/.margyn/licence                       # or $MARGYN_HOME/.margyn/licence</pre>
<p>It is verified offline against a public key compiled into the CLI, so a paid check runs on a runner
  with no network access. Licences last 31 days. Take a new one whenever you like while the
  subscription is active, which is also how a lapsed subscription stops working on its own.</p>
<p>A <b>Team</b> subscription mints a licence that carries the same capability as Watch, so the
  mutation proof unlocks either way. A <b>Fix flow</b> subscription unlocks nothing in the binary,
  which the licence says rather than implies: it is work delivered by a person, not a feature
  flag.</p>
<p>Every refusal names itself rather than collapsing into a single unhelpful no:</p>
<pre tabindex="0" role="group" aria-label="Licence refusal messages">no licence found
licence expired on 2026-09-06
licence signature does not match, so this licence was not issued by us
this licence covers watch, not fixpack</pre>
<p><strong>A refusal never fails your run.</strong> The reason is printed, the free scan runs in full,
  and the exit code still reflects your findings rather than your billing.</p>

<h2 id="ci">In CI</h2>
<p>Exit code 1 on findings is the whole integration, so this is the entire GitHub Actions step:</p>
<pre tabindex="0" role="group" aria-label="GitHub Actions, free checks">- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 22
- run: npx margyn-scan .</pre>
<p>With the mutation proof, pass the licence as a secret. Keep it on a schedule or on pull requests to
  main rather than on every push, because it runs your suite once per mutation:</p>
<pre tabindex="0" role="group" aria-label="GitHub Actions, with the mutation proof">- run: npx margyn-scan . --mutate --max=8
  env:
    MARGYN_LICENCE: \${{ secrets.MARGYN_LICENCE }}</pre>
<p>Two things worth knowing before you add it to a required check. Margyn reads the repository as it
  is checked out, so a checkout that omits files hides exactly the defect
  <code>ignored-source</code> exists to find. And the licence secret belongs in the repository or
  organisation secrets, not in the workflow file, for the reason on the
  <a href="/security">security page</a>.</p>

<h2 id="pr">Findings on the pull request</h2>
<p>The <a href="https://github.com/zkasuran/margyn">Margyn action</a> can post the findings where developers look. It
  writes a job summary every run, and on a pull request it will keep one comment updated in place and
  upload SARIF to the Security tab. It uses the job's own <code>GITHUB_TOKEN</code>, so nothing is
  hosted and no secret leaves your repository.</p>
<pre tabindex="0" role="group" aria-label="GitHub Actions, findings on the PR">permissions:
  contents: read
  pull-requests: write     # for the comment
  security-events: write   # for the Security tab
steps:
  - uses: actions/checkout@v4
  - uses: zkasuran/margyn@v0
    with:
      comment: true
      sarif: true</pre>
<p>Both are off by default and both are best-effort: if a comment or an upload fails, the step warns
  and still fails the job on findings, because the audit result is the exit code, not the comment.</p>

<h2 id="json">JSON output</h2>
<pre tabindex="0" role="group" aria-label="The JSON shape">{
  "root": "/path/to/repo",
  "findings": [
    {
      "check": "ignored-source",
      "severity": "high",
      "file": "packages/aave/abis-src/dist/IPool.mjs",
      "summary": "... is read by ... but git ignores it",
      "evidence": "ignore rule: .gitignore:2:dist/",
      "why": "A clean clone or a CI runner cannot read this file.",
      "reproduction": ["git -C . archive HEAD | tar -t | grep -qx ...", "test -f ..."]
    }
  ],
  "gate": { "mutation": "locked", "reason": "no licence found" }
}</pre>
<p><code>gate</code> is present only when <code>--mutate</code> was asked for. It reports whether
  the paid check ran. Use it to post findings on a pull request instead of failing the job. The exit
  code is unchanged by <code>--json</code>.</p>

<h2 id="nothing">When it finds nothing</h2>
<pre tabindex="0" role="group" aria-label="A clean result"><b>$ npx margyn-scan /path/to/repo</b>
margyn /path/to/repo

Nothing hollow found. Every check this tool knows how to test held up.</pre>
<p>Then your verification layer held up on the five things this tool knows how to test, which is worth
  knowing and cost you one command. It is a narrow tool on purpose. It has five checks, it says so,
  and it does not invent a sixth to make a report look busy.</p>
<p class="sm"><a href="/pricing">Pricing</a> &middot; <a href="/security">Security model</a> &middot;
  <a href="https://github.com/zkasuran/margyn">Source on GitHub</a></p>

  </div>
</div></div>
`,
};
