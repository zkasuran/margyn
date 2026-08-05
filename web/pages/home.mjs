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
  <p class="hero-links sm"><a href="#proof">See a real finding</a><a href="/docs">Documentation</a><a
    href="/pricing">Pricing</a></p>
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
    inverted a line inside our own mutation checker and 41 tests reported success. We publish
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
  <p class="sm prose">Want a mutation score for a whole codebase? That is
    <a href="https://stryker-mutator.io/">Stryker</a>, free and better at it than we are. Margyn
    runs a capped mutation proof as one check in a five check audit, then prints the surviving
    line. We never print a score.</p>
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
    <tr><td>Finished</td><td>All five checks. 41 tests, zero dependencies. Each check proves
      it fires on a planted defect, then proves it goes quiet on the fixed shape.</td></tr>
    <tr><td>Measured</td><td>Precision. Five real repositories went from 132, 51, 20, 6 and 12
      findings to 0, 2, 2, 2 and 0 after four fixes. The eight that remain are true.</td></tr>
    <tr><td>Honest about</td><td>The mutation proof is the newest check. Capped at four
      mutations by default, so it under-reports on purpose.</td></tr>
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
