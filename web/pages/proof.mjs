/**
 * Proof. Three claims, each with the command that checks it.
 *
 * Everything here was produced by a real run on a named commit and the commands
 * are the ones that were used, not illustrations of them.
 */
export default {
  path: "/proof",
  title: "Margyn proof: real findings on named commits, with the commands",
  ogTitle: "Every number on this site, with the command that checks it",
  description:
    "The pull request it was written from, a scan of five public repositories at named commits, then what it reports about its own suite. Each with the command to reproduce it.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Proof, with the commands</h1>
  <p class="lede prose">Three claims hold this product up. Each one is a real run against a named
    commit, each one followed by the command that reproduces it. Dated 2026-08-06.</p>
</div></section>

<section id="incident"><div class="wrap">
  <p class="eyebrow">Claim one</p>
  <h2>It was written from a pull request that went red</h2>
  <p class="prose"><a href="https://github.com/nishuzumi/moss/pull/157">nishuzumi/moss PR #157</a>,
    2026-08-01. Eight vendored modules lived under a path containing <code>dist/</code>. The root
    <code>.gitignore</code> excludes <code>dist/</code> at any depth, so git dropped all eight from
    the commit while they sat on disk untracked. Locally the suite was 26 tests green. In CI two
    tests failed, reading files that had never been pushed.</p>
  <p class="prose">The diff was innocent. The absence was the bug. Nothing in a diff shows you a
    file that is not there.</p>
<pre tabindex="0" role="group" aria-label="Margyn against the broken commit"><b>margyn /tmp/moss</b>   <span class="d"># reconstructed at c6cbb45, untracked files restored</span>

2 findings, each with a reproduction you can run.

<b>1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by</b>
<b>   packages/protocols/aave/README.md but git ignores it</b>
   <span class="r">HIGH</span>  <span class="d">ignored-source     ignore rule: .gitignore:2:dist/</span>
<b>2. packages/protocols/aave/abis-src/dist/abis/IPool.mjs is read by</b>
<b>   packages/protocols/aave/abis-src/VENDOR.json but git ignores it</b>
   <span class="r">HIGH</span>  <span class="d">ignored-source     ignore rule: .gitignore:2:dist/</span></pre>
  <p class="prose" style="margin-top:16px">Both reproductions answer, which is what turns a finding
    into a fact. Two statements about one path that disagree:</p>
<pre tabindex="0" role="group" aria-label="The reproduction for a dropped file"><b>$ git archive HEAD | tar -t | grep -qE '(^|/)&lt;the path the reader asks for&gt;$' \
    || echo 'NOTHING in HEAD answers &lt;path&gt;'</b>
NOTHING in HEAD answers dist/abis/IPool.mjs
<b>$ test -f '&lt;path&gt;' &amp;&amp; echo 'PRESENT on disk'</b>
PRESENT on disk</pre>
  <p class="prose" style="margin-top:16px">Against the fixed tree at <code>0c743c2</code> both high
    findings are gone and only the two medium advisories remain. A checker that cannot be shown to
    go quiet is as hollow as the checks it hunts, so that direction is tested too.</p>
</div></section>

<section id="public"><div class="wrap">
  <p class="eyebrow">Claim two</p>
  <h2>What it says about five public repositories</h2>
  <p class="prose">Run on 2026-08-06 against a shallow clone of each, at the commit named. Nothing
    was tuned for these repositories and nothing was left out because the number was inconvenient.
    Re-derived on 2026-08-15 with 0.2.1, at the same five commits: every number below still holds,
    down to the file and line of each named finding.</p>
  <table class="st">
    <tr><th>Repository</th><th>Commit</th><th>Findings</th></tr>
    <tr><td>chalk/chalk</td><td><code>661317e</code></td><td>0</td></tr>
    <tr><td>sindresorhus/execa</td><td><code>8017b27</code></td><td>0</td></tr>
    <tr><td>sindresorhus/got</td><td><code>e3924aa</code></td><td>1 unrun gate</td></tr>
    <tr><td>expressjs/express</td><td><code>a371447</code></td><td>3 unrun gates</td></tr>
    <tr><td>fastify/fastify</td><td><code>39e87e8</code></td><td>7 tests with no assertion, 2 that cannot fail, 4 unrun gates</td></tr>
  </table>
  <p class="sm prose" style="margin-top:18px">Reproduce any row in two commands. A clone is enough,
    since the static checks need no account:</p>
<pre tabindex="0" role="group" aria-label="Reproducing the public scan">git clone --depth 1 https://github.com/fastify/fastify.git /tmp/fastify
npx margyn-scan /tmp/fastify</pre>

  <h3 style="margin-top:34px">What a clean clone cannot show</h3>
  <p class="prose"><code>ignored-source</code> found nothing on any of the five. It could not
    have. It reports a file that is on disk and not in the commit, which by construction cannot
    exist in a fresh clone. That check fires on a working tree, which is where the moss defect
    lived. Saying so is the difference between a table and a claim.</p>

  <h3 style="margin-top:30px">All six no-assertion findings, named</h3>
  <p class="prose">Each one is a file and a line anyone can open. These are tests whose only failure
    mode is an exception: they run the code, assert nothing, then report green whatever came
    back. The table above says six, so all six are here rather than a selection.</p>
<pre tabindex="0" role="group" aria-label="Six named findings in fastify">fastify/fastify at 39e87e8

test/decorator.test.js:869               plugin required decorators
test/http2/closing.test.js:118           http/2 closes successfully with async await
test/http2/closing.test.js:133           https/2 closes successfully with async await
test/schema-special-usage.test.js:423    side effect on schema let the server crash
test/schema-special-usage.test.js:469    only response schema trigger AJV pollution
test/schema-special-usage.test.js:493    only response schema trigger AJV pollution #2</pre>
  <p class="sm prose" style="margin-top:14px">Two of those are worth reading before you judge the
    check: an <code>await close()</code> with no assertion is a deliberate smoke test in a lot of
    suites. That is why the finding says what it says rather than "cannot fail". It is reported
    with the line instead of a count for the same reason.</p>

  <h3 style="margin-top:30px">The same run found seven false positives, so they were fixed</h3>
  <p class="prose">The first pass reported 17 on fastify, not 10. Seven of those were in
    <code>test/trust-proxy.test.js</code> and every one of them was wrong: the tests declare
    <code>t.plan(11)</code> then assert through a helper that takes the test context. A planned
    count fails the test when it comes up short, so a body carrying one cannot be hollow.</p>
  <p class="prose">Both rules are now in the check and both directions are tested. That is the whole
    reason the number above is 10. A scanner that cries wolf is hollow itself, so a false positive
    is a defect here rather than a tuning preference.</p>
  <p class="sm"><a href="/docs#no-assertion">What fires this check, what does not</a> &middot;
    <a href="/changelog">The release it landed in</a></p>
</div></section>

<section id="itself"><div class="wrap">
  <p class="eyebrow">Claim three</p>
  <h2>What it said about itself, and what we did about it</h2>
  <p class="prose">The mutation proof inverts one line, runs the suite, then reports the suite that
    stayed green anyway. Pointed at this repository on 2026-08-12 it reported four survivors of four
    tried at the default cap and seven at a cap of twelve. One of them was inside the mutation
    checker itself. That list is below, unedited.</p>
<pre tabindex="0" role="group" aria-label="The seven surviving mutations reported on 2026-08-12">bin/build-pages.mjs             === -&gt; !==             <span class="r">suite still passed</span>
bin/contrast.mjs                === -&gt; !==             <span class="r">suite still passed</span>
src/checks/ignored-source.mjs   return true -&gt; false   <span class="r">suite still passed</span>
src/checks/lint-blindspots.mjs  &amp;&amp; -&gt; ||               <span class="r">suite still passed</span>
src/checks/mutation.mjs         return true -&gt; false   <span class="r">suite still passed</span>
src/checks/unrun-checks.mjs     !== -&gt; ===             <span class="r">suite still passed</span>
src/cli.mjs                     === -&gt; !==             <span class="r">suite still passed</span></pre>
  <p class="prose" style="margin-top:16px">Publishing that list was the easy half. On 2026-08-15 a
    test was written for every line on it, plus <code>src/prove.mjs</code>, which had joined the
    list. The suite went from 63 tests to 93. The run now reports this:</p>
<pre tabindex="0" role="group" aria-label="The same proof today, over every file in the repository">$ <b>every candidate file, cap 60</b>
37 files tracked as source, 24 carry a mutation this tool knows how to make
24 mutated, 24 caught by the suite, <span class="g">0 survivors</span>, 14 seconds
93 tests, 0 failing</pre>
  <p class="prose" style="margin-top:16px">Each of those tests pins the behaviour the mutation
    changed, not the mutation. <code>src/cli.mjs</code> had no test at all, so its exit code, its
    JSON and its locked-licence message are now checked by running the real binary.
    <code>worker/index.mjs</code> got the one that mattered most: inverted, the entitlement branch
    refuses a licence to every customer who has paid. Nothing was watching it.</p>
  <p class="prose">The proof also found a defect that was not a missing test.
    <code>bin/build-pages.mjs</code> ran its build as a side effect of being imported, so a test that
    imported it rebuilt the whole site, and under a mutated mapping it wrote
    <code>web/public/.html</code> and sent every page to the wrong file. The build is behind a
    run-as-a-command guard now.</p>
  <p class="sm prose">The paid gate is on the CLI flag rather than on the code, so a clone
    reproduces this without a licence:</p>
<pre tabindex="0" role="group" aria-label="Reproducing the self audit">git clone https://github.com/zkasuran/margyn &amp;&amp; cd margyn &amp;&amp; npm test
node --input-type=module -e 'import { mutationProof } from "./src/checks/mutation.mjs";
console.log(mutationProof(process.cwd(), { max: 60 }).map(f =&gt; f.summary));'</pre>
  <p class="sm prose">Zero survivors is a claim about this suite against these seven mutation
    operators, not a claim that the code is correct. A stronger operator set would find more, which
    is the honest reading of any mutation score.</p>
</div></section>

<section><div class="wrap">
  <h2>The number this page does not have</h2>
  <p class="prose">An earlier run across five other repositories went from 132, 51, 20, 6 and 12
    findings to 0, 2, 2, 2 and 0 after four precision fixes. It is a true story about how the
    matching rules were built. It is also the weakest number we have ever published, because those
    five repositories were never written down, so nobody can re-run it. That is why the table above
    exists and names every commit.</p>
  <p class="prose">If you want the older number to mean something, the fix is not an argument, it is
    a list of five repositories and a date. Until then this page carries the run you can repeat.</p>
</div></section>

<section><div class="wrap">
  <h2>Run it on your own repository</h2>
  <div class="run">
    <code id="cmd-proof">npx margyn-scan /path/to/repo</code>
    <button data-copy="cmd-proof">Copy</button>
  </div>
  <p class="sm prose">Nothing is uploaded and no account is needed. If it finds nothing, you learned
    that for free.</p>
  <p class="sm"><a href="/pricing">Pricing</a> &middot; <a href="/docs">Documentation</a> &middot;
    <a href="/security">Why there is no hosted scan</a></p>
</div></section>
`,
};
