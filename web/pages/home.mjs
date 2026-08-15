/**
 * The home page. Written for someone deciding whether to run it on their repo,
 * in the order they decide: what it gives back, how fast, where it lives, what it
 * finds, whether it is for them, how it differs, what it costs.
 *
 * The evidence about ourselves lives on /proof. It is the strongest thing we have
 * and it belongs one click away rather than in the middle of the page, because a
 * buyer wants their problem solved before they want our confession.
 */
export default {
  path: "/",
  title: "Margyn: audit your test suite and prove which checks are hollow",
  ogTitle: "Your tests pass. That is not the same as working.",
  description:
    "Margyn finds tests that assert nothing, files git never committed and gates nothing invokes, then ships a command that reproduces every finding. Free CLI, $8.99 a month for the mutation proof.",
  schema: true,
  session: true,
  body: `
<section class="hero"><div class="wrap">
  <h1 class="prose">Your tests pass. That is not the same as working.</h1>
  <p class="lede prose">Margyn audits the machinery that is supposed to catch your bugs, then hands
    you the command that proves each finding. Point it at a repository and it answers in about a
    second.</p>

  <div class="run">
    <code id="cmd">npx margyn-scan /path/to/repo</code>
    <button id="copy" data-copy="cmd">Copy</button>
  </div>
  <p class="sm prose">Node 22 and git. No account, no config file, nothing uploaded.</p>
  <p class="cta">
    <a class="btn" href="/pricing">Get Watch, 3 days free</a>
    <a class="btn ghost" href="#finding">See a real finding</a>
  </p>
  <ul class="chips" aria-label="Facts about the free scan">
    <li>No account</li>
    <li>No network call</li>
    <li>Zero dependencies</li>
    <li>MIT licensed</li>
  </ul>
</div></section>

<section><div class="wrap">
  <h2>Three ways a green pipeline lies to you</h2>
  <table class="st">
    <tr><th>A file the build reads is not in the commit</th><td>Your machine has it untracked, so
      every local run is green. A clean clone does not have it, so CI fails on a file nobody
      removed. The diff looks innocent, because the defect is an absence.</td></tr>
    <tr><th>A test that asserts nothing</th><td>It calls the code, throws nothing, then reports
      green whatever came back. It counts toward coverage and guards nothing, so the bug it was
      written for ships anyway.</td></tr>
    <tr><th>A gate nobody invokes</th><td>A <code>verify</code> or <code>test:online</code> script
      sits in the manifest, reads as coverage to every reviewer, then never fails because no
      workflow calls it.</td></tr>
  </table>
  <p class="sm prose" style="margin-top:18px">All three are invisible to a code reviewer, to a
    coverage percentage and to an AI that reads the diff. Margyn was written from the first one,
    then from the other two.</p>
</div></section>

<section><div class="wrap">
  <h2>Three steps, about a second</h2>
  <ol class="steps prose">
    <li><b>Run it.</b> <code>npx margyn-scan .</code> in any git repository. Nothing to install, no
      account, no configuration file.</li>
    <li><b>Read the findings.</b> Each names a file and a line, says why it matters, then gives you
      the command that reproduces it. A finding that cannot carry one is dropped rather than
      printed.</li>
    <li><b>Gate the pipeline.</b> Exit code 1 when anything was found, so one line in your workflow
      turns it into a required check.</li>
  </ol>
<pre tabindex="0" role="group" aria-label="The GitHub Actions step">- uses: zkasuran/margyn@v0
  with:
    path: .</pre>
  <p class="sm prose" style="margin-top:14px">That is the whole integration. The action lives in the
    same repository as the scanner and pins the release it runs, so a job cannot change under you.
    Our own pipeline runs it over our own repository on every push.</p>
</div></section>

<section id="checks"><div class="wrap">
  <h2>What it looks for</h2>
  <ul class="checks prose">
    <li>
      <div class="top"><span class="nm">ignored-source</span><span class="sev high">high</span></div>
      <p>Files the repository reads that git never committed. Green on your laptop because the file
        is on your disk untracked, red in CI reading something that was never pushed.</p>
    </li>
    <li>
      <div class="top"><span class="nm">no-assertion</span><span class="sev high">high</span></div>
      <p>Tests that assert nothing, so only an exception can fail them. Assertions reached through a
        helper count, as does a declared count like <code>t.plan(11)</code>.</p>
    </li>
    <li>
      <div class="top"><span class="nm">cannot-fail</span><span class="sev high">high</span></div>
      <p>Tests full of assertions that hold whatever the code does: a literal answered in a catch, a
        swallowed assertion, a status list that accepts both the success and the failure.</p>
    </li>
    <li>
      <div class="top"><span class="nm">mutation</span><span class="sev high">high</span><span class="paid">part of Watch</span></div>
      <p>Inverts a line, runs your suite, then reports the suite that stayed green anyway. There is
        no arguing with a test that passed while the thing it guards was inverted.</p>
    </li>
    <li>
      <div class="top"><span class="nm">unrun-check</span><span class="sev med">medium</span></div>
      <p>A gate declared in the manifest that no workflow invokes and no sibling script calls. It
        reads as coverage in the repository and cannot fail.</p>
    </li>
    <li>
      <div class="top"><span class="nm">lint-blindspot</span><span class="sev med">medium</span></div>
      <p>Linters whose exclusions come from the ignore file instead of their own config, so a newly
        tracked path silently enters the tool's scope.</p>
    </li>
  </ul>
  <p class="sm" style="margin-top:22px"><a href="/docs#checks">What fires each check, what
    deliberately does not</a> &middot; <a href="/suggest">Ask for a check that does not exist</a></p>
</div></section>

<section><div class="wrap">
  <h2>Who runs this</h2>
  <table class="st">
    <tr><th>Your AI wrote most of last month's tests</th><td>Volume went up and nobody audited the
      tests. The tools that generate them cannot check them, since they wrote them. Margyn reads what
      the repository claims to verify, then proves which of those claims are empty.</td></tr>
    <tr><th>You own a monorepo with vendored files</th><td>Ignore rules reach further than anyone
      remembers, so a file the build reads can be missing from the commit while every local run stays
      green.</td></tr>
    <tr><th>You inherited the suite</th><td>Nobody left can say which tests are load bearing. Invert
      a line and see which ones notice. The ones that do not are your answer.</td></tr>
    <tr><th>You own the CI gate</th><td>You are the one who gets asked why the pipeline was green on
      Friday. Margyn fails the build on exit code 1 rather than filing a dashboard nobody
      opens.</td></tr>
  </table>
</div></section>

<section id="finding"><div class="wrap">
  <p class="eyebrow">A real run</p>
  <h2>What it found in a repository that had just gone red</h2>
  <p class="prose">Eight vendored modules sat under a path containing <code>dist/</code>, which the
    root ignore file excludes at any depth, so git dropped all eight while they sat on disk. Locally
    26 tests were green. In CI two failed, reading files that had never been pushed.</p>
<pre tabindex="0" role="group" aria-label="Terminal output from a real scan"><b>margyn /tmp/moss</b>

2 findings, each with a reproduction you can run.

<b>1. packages/protocols/aave/abis-src/dist/AaveV3Monad.mjs is read by</b>
<b>   packages/protocols/aave/README.md but git ignores it</b>
   <span class="r">HIGH</span>  <span class="d">ignored-source     ignore rule: .gitignore:2:dist/</span>
   <span class="d">reproduce:</span>
     git archive HEAD | tar -t | grep -qx '&lt;path&gt;' || echo 'ABSENT from HEAD'
     test -f '&lt;path&gt;' &amp;&amp; echo 'PRESENT on disk'</pre>
  <p class="sm prose" style="margin-top:14px">Run those two lines and they answer <code>ABSENT from
    HEAD</code> then <code>PRESENT on disk</code>. Two facts about one path that disagree, which is
    what a finding is here.</p>
  <p class="sm"><a href="/proof">The whole run, plus scans of five public repositories at named
    commits</a></p>
</div></section>

<section><div class="wrap">
  <h2>Where it sits next to the tools you already pay for</h2>
  <p class="prose">None of this is a replacement. The right column is the argument: each of these
    answers a different question. None of them answers ours.</p>
  <table class="st">
    <tr><th>Tool</th><th>What it answers</th></tr>
    <tr><td><b>Margyn</b></td><td>Does this suite check anything, with a command that proves each
      answer. Billed per repository owner, never per seat.</td></tr>
    <tr><td>Coverage, Codecov for one</td><td>Did this line run while a test was in progress. Their
      own blog concedes that
      <a href="https://about.codecov.io/blog/mutation-testing-how-to-ensure-code-coverage-isnt-a-vanity-metric/">it
      is too easy to write high-coverage tests that don't deliver value</a>. Billed per user.</td></tr>
    <tr><td>Static analysis, Sonar or Codacy</td><td>Does this code match a rule set. Billed per line
      of code or per committer.</td></tr>
    <tr><td>AI reviewers, CodeRabbit or Qodo</td><td>Does this diff look wrong, plus here are more
      tests. They manufacture the artefact we audit. Billed per user.</td></tr>
    <tr><td>Mutation frameworks, Stryker or PIT</td><td>What percentage of mutants your suite kills.
      Free and open source, better at scoring than we are, which is why we never print a
      score.</td></tr>
  </table>
  <p class="sm prose" style="margin-top:18px">Billing models read from each vendor's own pricing page
    on 2026-08-05. If a mutation score across a whole codebase is what you want, use
    <a href="https://stryker-mutator.io/">Stryker</a>.</p>
</div></section>

<section id="pricing"><div class="wrap">
  <h2>Five checks free. The sixth is $8.99 a month.</h2>
  <div class="tiers">
    <div class="tier">
      <p class="tag">Free scan</p>
      <p class="amt">$0<span class="per"> forever</span></p>
      <ul>
        <li>Five static checks, no account, no licence</li>
        <li>A reproduction under every finding</li>
        <li>Exit code 1, so it gates CI today</li>
      </ul>
      <div class="fill"></div>
      <div class="run">
        <code id="cmd-free">npx margyn-scan /path/to/repo</code>
        <button data-copy="cmd-free">Copy</button>
      </div>
    </div>
    <div class="tier pick">
      <p class="tag">Watch</p>
      <p class="amt">$8.99<span class="per"> a month, 3 days free</span></p>
      <ul>
        <li>Everything in the free scan</li>
        <li>The mutation proof: it inverts a line, runs your suite, reports what stayed green</li>
        <li>A licence your CI verifies offline, so it works on a runner with no network</li>
        <li>Cancel whenever. The free checks keep working either way</li>
      </ul>
      <div class="fill"></div>
      <p class="cta"><a class="btn" href="/pricing">Start the 3 day trial</a></p>
    </div>
  </div>
  <p class="sm prose" style="margin-top:20px">Per repository owner, never per seat. A CI gate has no
    seats, so charging for engineers who never open the tool would be charging for nothing.
    <b>Team is $29 a month</b> for every repository an organisation owns, and
    <b><a href="/pricing#fix">Fix flow</a> is $79 a month</b> if you would rather the findings
    arrived already fixed, as a patch carrying a test that fails before it and passes after.</p>
</div></section>

<section><div class="wrap">
  <h2>Questions people ask before they run it</h2>
  <div class="faq prose">
    <details><summary>Is my code uploaded?</summary>
      <p>No. There is nowhere for it to go. Margyn is a local command line tool. The deployed
        site has no scan endpoint on purpose, which you can check: <code>POST /api/scan</code>
        answers 404. The <a href="/security">security page</a> lists every process it starts.</p></details>
    <details><summary>How many false positives am I about to eat?</summary>
      <p>On five public repositories at named commits it reported 0, 0, 1, 3 and 10 findings. That
        run also produced seven wrong ones, all in one file, so the checker was fixed rather than the
        number. Both the before and the after are on the <a href="/proof#public">proof
        page</a>.</p></details>
    <details><summary>Does it need an account to try?</summary>
      <p>No. <code>npx margyn-scan /path/to/repo</code> needs no sign in, no key and no network. An
        account exists to buy the mutation proof and collect a licence.</p></details>
    <details><summary>What happens to my build if billing breaks?</summary>
      <p>Nothing. Ask for a paid check without a valid licence and Margyn prints the reason, runs the
        free scan in full, then exits on your findings rather than on your billing.</p></details>
    <details><summary>It edits my files?</summary>
      <p>Only under <code>--mutate</code>, one file at a time, only after your suite has passed
        unmutated. Each file is restored in a <code>finally</code> block and on
        <code>SIGINT</code>. Leave the flag off and nothing is ever written.</p></details>
    <details><summary>Who is behind it?</summary>
      <p>Asura Coding Works. The code is MIT licensed and public, sign in and payments run on
        <a href="https://tiun.business">Tiun</a>. Support goes through
        <a href="https://github.com/zkasuran/margyn/issues">the repository issues</a>.</p></details>
  </div>
</div></section>

<section><div class="wrap">
  <h2>Run it on your own repository</h2>
  <div class="run">
    <code id="cmd-end">npx margyn-scan /path/to/repo</code>
    <button data-copy="cmd-end">Copy</button>
  </div>
  <p class="sm prose">If it finds nothing, you learned that for free in about a second. If it finds
    something, every line comes with a command that proves it.</p>
  <p class="cta" style="margin-top:18px">
    <a class="btn" href="/pricing">Get Watch, 3 days free</a>
    <a class="btn ghost" href="/docs">Read the docs</a>
  </p>
</div></section>
`,
};
