/** Pricing. One price, what is free, then the reason the paid check is paid. */
export default {
  path: "/pricing",
  title: "Margyn pricing: four checks free, the mutation proof from $8.99 a month",
  ogTitle: "Four checks are free. The fifth runs your suite, so it costs money.",
  description:
    "The four static checks are free with no account and no licence. Watch is $8.99 a month, adds the mutation proof and mints a licence your CI verifies offline. Three days free.",
  session: true,
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Four checks are free. The fifth runs your suite, so it costs money.</h1>
  <p class="lede prose">Watch is $8.99 a month. It adds the mutation proof, which is the check that
    edits your tree and runs your whole suite once per mutation. The four static checks stay free
    with no account, no licence and no network.</p>
</div></section>

<section><div class="wrap">
  <div class="tiers">
    <div class="tier">
      <p class="tag">Free scan</p>
      <p class="amt">$0<span class="per"> forever</span></p>
      <ul>
        <li>Four static checks: ignored-source, no-assertion, unrun-check, lint-blindspot</li>
        <li>No account, no licence, no network call at any point</li>
        <li>Every finding carries a command that reproduces it</li>
        <li>Exit code 1 on findings, so it works as a CI gate today</li>
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
        <li>The mutation proof: it inverts a line, runs your suite, then reports the suite that
          stayed green anyway</li>
        <li>A licence your CI verifies offline, so a paid check runs on a runner with no network</li>
        <li>Cancel whenever you like. The four free checks keep working either way</li>
      </ul>
      <div class="fill"></div>
      <p class="cta">
        <button id="buylogin">Sign in to start the trial</button>
        <button id="buy" hidden>Start the 3 day trial</button>
      </p>
      <p class="sm" id="buynote">3 days free, then $8.99 a month. Checkout runs on Tiun.</p>
    </div>
  </div>
</div></section>

<section><div class="wrap">
  <h2>Why this is the one you pay for</h2>
  <p class="prose">The static checks read your tree once and finish in under a second. The mutation
    proof inverts a line, runs your entire test suite, restores the file, then does it again. That
    is real machine time and it is the honest line between the two. The free four are not crippled
    versions of anything.</p>
  <p class="prose">It is also the check with the most to go wrong, so it is bounded. A red baseline
    aborts the run instead of producing results that would mean nothing. Each run is timed out. The
    file is restored in a <code>finally</code> block and on <code>SIGINT</code>, so an interrupted
    scan cannot leave a mutated tree behind. It is capped at four mutations by default, which means
    it under-reports on purpose. Raise the cap to find more.</p>
  <p class="sm prose">We never print a mutation score. If you want a score across a whole codebase
    that is <a href="https://stryker-mutator.io/">Stryker</a>, free and better at it than we are.
    Margyn sells the sentence instead: we inverted this line, ran your suite and it passed.</p>
</div></section>

<section id="licence"><div class="wrap">
  <h2>What you get is a licence, not a login</h2>
  <p class="prose">After checkout, the button in the top bar hands you a signed licence. Put it
    anywhere the CLI can read it:</p>
<pre tabindex="0" role="group" aria-label="Installing a licence"><b>$ npx margyn-scan /path/to/repo --mutate</b>
The mutation proof is part of Watch and it is locked: no licence found.
Everything below is the free scan, which ran in full.

<b>$ mkdir -p ~/.margyn &amp;&amp; pbpaste &gt; ~/.margyn/licence</b>   <span class="d"># or export MARGYN_LICENCE=...</span>
<b>$ npx margyn-scan /path/to/repo --mutate</b>
4 findings, each with a reproduction you can run.</pre>
  <p class="prose" style="margin-top:16px">The licence is signed with Ed25519 and checked against a
    public key compiled into the CLI, so verifying it needs no network. That is the whole reason
    this works on a locked-down runner. A licence check that phones home is a new way for a build
    to go red for a reason that has nothing to do with the code.</p>
  <p class="prose">A refusal never fails your run. Ask for a paid check without a licence and
    Margyn prints why, runs the free scan in full, then exits on its own findings. Billing is not
    a reason to break someone's build.</p>
  <p class="sm"><a href="/docs#licence">How the licence is installed and verified</a> &middot; <a
    href="/security">The security model</a></p>
</div></section>

<section><div class="wrap">
  <h2>Billing, stated plainly</h2>
  <table class="st">
    <tr><th>Price</th><td>8.99 USD per month, per repository owner. No per seat and no per
      committer billing: a CI gate has no seats, so charging for engineers who never open the tool
      would be charging for nothing.</td></tr>
    <tr><th>Trial</th><td>Three days at no charge. Checkout tells you what it needs before you
      confirm anything.</td></tr>
    <tr><th>Renewal</th><td>Monthly, until you cancel.</td></tr>
    <tr><th>Cancelling</th><td>Any time. The licence on your disk keeps working until it expires
      and the four free checks are unaffected.</td></tr>
    <tr><th>Refunds</th><td>Ask within 14 days of a charge and it is refunded. See the
      <a href="/terms">terms</a>.</td></tr>
    <tr><th>Cards</th><td>Handled by <a href="https://tiun.business">Tiun</a>, which runs sign in
      and checkout. We never see a card number.</td></tr>
    <tr><th>Licence validity</th><td>31 days from the moment it is issued. Take a new one whenever
      you like while the subscription is active, which is also how it stops working on its own if
      the subscription lapses.</td></tr>
  </table>
</div></section>

<section><div class="wrap">
  <h2>Questions people actually ask</h2>
  <div class="faq prose">
    <details><summary>Do I need an account to try it?</summary>
      <p>No. <code>npx margyn-scan /path/to/repo</code> needs no sign in, no key and no network. An
        account exists to buy the mutation proof and collect a licence, nothing else.</p></details>
    <details><summary>What happens if my licence expires during a build?</summary>
      <p>The mutation proof is skipped and the reason is printed. The free scan still runs in full
        and the exit code still reflects your findings rather than your billing.</p></details>
    <details><summary>Is my code uploaded anywhere?</summary>
      <p>No. There is nowhere for it to go. Margyn is a local CLI. The deployed site has no
        scan endpoint on purpose, which you can check: <code>POST /api/scan</code> answers 404.</p></details>
    <details><summary>Mutation testing already exists. Why would I pay you for it?</summary>
      <p>You would not, if a mutation score is what you want. Stryker gives that away and does it
        better. Margyn runs a capped mutation proof as one check inside a five check audit. The
        other four catch things a mutation framework structurally cannot: a file that is not in the
        commit, a gate nobody invokes, a linter whose scope comes from the ignore file.</p></details>
    <details><summary>It edits my files?</summary>
      <p>Only under <code>--mutate</code>, only one file at a time, only after your suite has
        passed unmutated. Each file is restored in a <code>finally</code> block and on
        <code>SIGINT</code>. Leave the flag off and nothing is ever written.</p></details>
    <details><summary>What if you disappear?</summary>
      <p>The CLI is MIT licensed with no runtime dependencies, so it is readable and forkable. It
        is a CLI rather than a service, so there is nothing to go dark and nothing to migrate off.
        The licence is verified offline, so a scan never needs us to be reachable.</p></details>
  </div>
</div></section>

<section><div class="wrap">
  <h2>Run it before you decide</h2>
  <div class="run">
    <code id="cmd-close">npx margyn-scan /path/to/repo</code>
    <button data-copy="cmd-close">Copy</button>
  </div>
  <p class="sm prose">If it finds nothing, you learned that for free. If it finds something, every
    line comes with a command that proves it.</p>
</div></section>
`,
};
