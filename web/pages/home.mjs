/** The home page. One claim, the proof, then the way in. */
export default {
  path: "/",
  title: "Margyn: prove your test suite actually tests something",
  ogTitle: "Your tests pass. That is not the same as working.",
  description:
    "Margyn audits the machinery that is supposed to catch your bugs. It finds tests that assert nothing, files git never committed and gates nothing invokes. Every finding ships a reproduction you can run.",
  schema: true,
  session: true,
  body: `
<section class="hero"><div class="wrap">
  <h1 class="prose">Your tests pass. That is not the same as working.</h1>
  <p class="lede prose">Margyn audits the machinery that is supposed to catch your bugs. It
    does not review your code. Every finding ships a reproduction you can run. No reproduction,
    no finding.</p>

  <div class="run">
    <code id="cmd">npx margyn-scan /path/to/repo</code>
    <button id="copy" data-copy="cmd">Copy</button>
  </div>
  <p class="sm prose">Zero dependencies. Node 22 and git. Exit code 1 on findings, so it works
    as a CI gate. Your code never leaves your machine.</p>
  <p class="cta">
    <a class="btn" href="/pricing">Get Watch, 3 days free</a>
    <a class="btn ghost" href="/proof">See the proof</a>
  </p>
  <ul class="chips" aria-label="Facts about the free scan">
    <li>No account</li>
    <li>No network call</li>
    <li>Zero dependencies</li>
    <li>MIT licensed</li>
  </ul>
</div></section>

<section id="proof"><div class="wrap">
  <p class="eyebrow">A real run</p>
  <h2>Against the commit that broke</h2>
  <p class="prose">Eight vendored modules sat under a path containing <code>dist/</code>, which
    the root <code>.gitignore</code> excludes at any depth, so git dropped all eight while they
    sat on disk. Locally: 26 tests green. In CI: two failed, reading files never pushed. The
    diff was innocent. The absence was the bug.</p>
<pre tabindex="0" role="group" aria-label="Terminal output from a real scan"><b>margyn /tmp/moss</b>

2 findings, each with a reproduction you can run.

<b>1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by</b>
<b>   packages/protocols/aave/README.md but git ignores it</b>
   <span class="r">HIGH</span>  <span class="d">ignored-source     ignore rule: .gitignore:2:dist/</span>
   <span class="d">reproduce:</span>
     git archive HEAD | tar -t | grep -qx '&lt;path&gt;' || echo 'ABSENT from HEAD'
     test -f '&lt;path&gt;' &amp;&amp; echo 'PRESENT on disk'</pre>
  <p class="sm prose" style="margin-top:14px">Two facts about one file that disagree. Against
    the fixed tree both findings are gone, because a checker that cannot be shown to go quiet
    is as hollow as what it hunts.</p>
  <p class="sm"><a href="/proof#incident">The whole incident, with the reproduction that answers</a></p>
</div></section>

<section><div class="wrap">
  <h2>Who runs this</h2>
  <table class="st">
    <tr><th>Your AI wrote most of last month's tests</th><td>Volume went up and nobody audited the
      tests. The tools that generate them cannot check them, since they wrote them. Margyn reads
      what the repository claims to verify, then proves which of those claims are empty.</td></tr>
    <tr><th>You own a monorepo with vendored files</th><td>Ignore rules reach further than anyone
      remembers, so a file the build reads can be missing from the commit while every local run
      stays green. That is the defect this tool was written from.</td></tr>
    <tr><th>You inherited the suite</th><td>Nobody left can say which tests are load bearing. Invert
      a line and see which ones notice. The ones that do not are the answer.</td></tr>
    <tr><th>You own the CI gate</th><td>A script nothing invokes reads as coverage in the repository
      and cannot fail. Margyn names them, then fails your build on exit code 1 rather than filing a
      dashboard nobody opens.</td></tr>
  </table>
</div></section>

<section><div class="wrap">
  <p class="eyebrow">We ran it on ourselves</p>
  <h2>Margyn finds holes in Margyn</h2>
  <p class="prose">The mutation proof inverts one line, runs the suite, then reports the suite
    that stayed green anyway. Pointed at our own repository at the default cap of four
    mutations, all four survived. Raise the cap to twelve and six do.</p>
<pre tabindex="0" role="group" aria-label="Four surviving mutations in Margyn's own suite">bin/build-pages.mjs            === -&gt; !==             <span class="r">suite still passed</span>
bin/contrast.mjs               === -&gt; !==             <span class="r">suite still passed</span>
src/checks/ignored-source.mjs  return true -&gt; false   <span class="r">suite still passed</span>
src/checks/mutation.mjs        return true -&gt; false   <span class="r">suite still passed</span></pre>
  <p class="prose" style="margin-top:16px">The last one is the mutation checker. Our own tool
    inverted a line inside our own mutation checker and 43 tests reported success. We publish
    the number rather than the cap that flatters it.</p>
  <p class="sm prose">Check it on our repository rather than taking it from us. The paid gate is on
    the CLI flag, not on the code, so a clone reproduces this without a licence:</p>
<pre tabindex="0" role="group" aria-label="Reproducing the self audit from a clone">git clone https://github.com/zkasuran/margyn &amp;&amp; cd margyn &amp;&amp; npm test
node --input-type=module -e 'import { mutationProof } from "./src/checks/mutation.mjs";
console.log(mutationProof(process.cwd(), { max: 12 }).map(f =&gt; f.summary));'</pre>
</div></section>

<section><div class="wrap">
  <h2>Your AI wrote 400 tests last month. How many can fail?</h2>
  <p class="prose">Test volume went up and nobody audited the tests. The tools that generate
    them cannot check them, since they wrote them. Coverage will not tell you either: Codecov's
    own blog concedes that
    <a href="https://about.codecov.io/blog/mutation-testing-how-to-ensure-code-coverage-isnt-a-vanity-metric/">it
    is too easy to write high-coverage tests that don't deliver value</a>. The product still
    centres the percentage.</p>
  <p class="prose">Margyn is the other half. It reads what your repository claims to verify,
    then proves which of those claims are empty.</p>
</div></section>

<section><div class="wrap">
  <h2>What it looks for</h2>
  <ul class="checks prose">
    <li>
      <div class="top"><span class="nm">ignored-source</span><span class="sev high">high</span></div>
      <p>Files the repo reads that git never committed. Green on your laptop because the file
        is on your disk untracked, red in CI reading something that was never pushed.</p>
    </li>
    <li>
      <div class="top"><span class="nm">no-assertion</span><span class="sev high">high</span></div>
      <p>Tests that assert nothing. The body runs, throws nothing and reports green whatever
        the code returned. Assertions reached through a helper still count.</p>
    </li>
    <li>
      <div class="top"><span class="nm">mutation</span><span class="sev high">high</span><span class="paid">part of Watch</span></div>
      <p>Inverts a line, runs the suite, reports the suite that stayed green anyway. There is
        no arguing with a test that passed while the thing it guards was inverted.</p>
    </li>
    <li>
      <div class="top"><span class="nm">unrun-check</span><span class="sev med">medium</span></div>
      <p>A <code>test:online</code> or <code>verify</code> script that no workflow invokes and
        no sibling script calls. It reads as coverage in the repository and cannot fail.</p>
    </li>
    <li>
      <div class="top"><span class="nm">lint-blindspot</span><span class="sev med">medium</span></div>
      <p>Linters whose exclusions come from <code>.gitignore</code> instead of their own
        config, so a newly tracked path silently enters the tool's scope.</p>
    </li>
  </ul>
  <p class="sm" style="margin-top:22px"><a href="/docs#checks">What fires each check, what
    deliberately does not</a></p>
</div></section>

<section><div class="wrap">
  <h2>Where it sits next to the tools you already pay for</h2>
  <p class="prose">None of this is a replacement. The right column is the whole argument: each of
    these answers a different question. None of them answers ours.</p>
  <table class="st">
    <tr><th>Tool</th><th>What it answers</th></tr>
    <tr><td><b>Margyn</b></td><td>Does this suite check anything, with a command that proves each
      answer. Billed per repository owner, never per seat.</td></tr>
    <tr><td>Coverage, Codecov for one</td><td>Did this line run while a test was in progress. Billed
      per user.</td></tr>
    <tr><td>Static analysis, Sonar or Codacy</td><td>Does this code match a rule set. Billed per
      line of code or per committer.</td></tr>
    <tr><td>AI reviewers, CodeRabbit or Qodo</td><td>Does this diff look wrong, plus here are more
      tests. They manufacture the artefact we audit. Billed per user.</td></tr>
    <tr><td>Mutation frameworks, Stryker or PIT</td><td>What percentage of mutants your suite kills.
      Free and open source, better at scoring than we are, which is why we never print a
      score.</td></tr>
  </table>
  <p class="sm prose" style="margin-top:18px">Billing models read from each vendor's own pricing
    page on 2026-08-05. If a mutation score across a whole codebase is what you want, use
    <a href="https://stryker-mutator.io/">Stryker</a>. Margyn runs a capped mutation proof as one
    check inside a five check audit, then prints the surviving line.</p>
</div></section>

<section><div class="wrap">
  <h2>It belongs in CI. At most it costs $8.99 a month.</h2>
  <p class="prose">Exit code 1 when anything was found, so there is no wrapper to write:</p>
<pre tabindex="0" role="group" aria-label="Margyn as a GitHub Actions step">- run: npx margyn-scan .</pre>
  <p class="prose" style="margin-top:16px">The four static checks are free forever, with no account
    and no licence. <strong>Watch is $8.99 a month</strong> and adds the mutation proof, which is the
    check that costs real machine time: it edits your tree and runs your whole suite once per
    mutation. Three days free.</p>
  <p class="prose">The licence is signed and verified offline, so the paid check runs on a runner with
    no network. Ask for it without one and Margyn prints the reason, runs the free scan in full, then
    exits on your findings. Billing is not a reason to break someone's build.</p>
  <p class="sm"><a href="/pricing">Pricing and what a licence is</a> &middot; <a href="/docs#ci">The
    CI setup</a> &middot; <a href="/security">Why there is no hosted scan</a></p>
</div></section>

<section><div class="wrap">
  <h2>Where this actually is</h2>
  <p class="prose">Margyn went public this month. It has no customers yet. This page carries no
    testimonials, no logos and no download count, because there are none to report and a
    placeholder version of those would be the exact thing this tool was built to catch.</p>
  <table class="st">
    <tr><td>Finished</td><td>All five checks. 43 tests, zero dependencies. Each check proves
      it fires on a planted defect, then proves it goes quiet on the fixed shape.</td></tr>
    <tr><td>Measured</td><td>Five public repositories at named commits on 2026-08-06: 0, 0, 1, 3
      and 10 findings, every one of them checkable. <a href="/proof#public">The table, with the
      commits</a>.</td></tr>
    <tr><td>Honest about</td><td>That same run reported seven findings that were wrong, all in one
      file. The checker was fixed rather than the number, which is why it now reports 10 on fastify
      instead of 17.</td></tr>
    <tr><td>Not built</td><td>Generating the fix rather than naming the defect. Local versus
      CI environment divergence.</td></tr>
  </table>
  <p class="sm prose" style="margin-top:18px">You do not have to believe any of it. Run it on
    your own repository.</p>
</div></section>

<section><div class="wrap">
  <h2>Run it on your own repository</h2>
  <div class="run">
    <code id="cmd-end">npx margyn-scan /path/to/repo</code>
    <button data-copy="cmd-end">Copy</button>
  </div>
  <p class="sm prose">If it finds nothing, you learned that for free. If it finds something, every
    line comes with a command that proves it.</p>
</div></section>
`,
};
