/** Pricing. One price, what is free, then the reason the paid check is paid. */
export default {
  path: "/pricing",
  title: "Margyn pricing: five checks free, the mutation proof from $8.99 a month",
  ogTitle: "Four checks are free. The fifth runs your suite, so it costs money.",
  description:
    "The five static checks are free with no account and no licence. Watch is $8.99 a month, adds the mutation proof and mints a licence your CI verifies offline. Three days free.",
  session: true,
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Four checks are free. The fifth runs your suite, so it costs money.</h1>
  <p class="lede prose">Watch is $8.99 a month for one owner's repositories. Team is $29 a month for
    an organisation. Solo Fix is $19 a month for one finding fixed, Fix flow is $79 a month for
    three, if you would rather the findings arrived already fixed. The five static checks stay free
    with no account, no licence and no network.</p>
</div></section>

<section><div class="wrap">
  <div class="tiers three">
    <div class="tier">
      <p class="tag">Free scan</p>
      <p class="amt">$0<span class="per"> forever</span></p>
      <ul>
        <li>Four static checks: ignored-source, no-assertion, unrun-check, lint-blindspot</li>
        <li>No account, no licence, no network call at any point</li>
        <li>Every finding carries a command that reproduces it</li>
        <li><code>--prove</code> runs each finding's own proof, then retracts anything it cannot reproduce</li>
        <li>On a pull request: a comment, a job summary and SARIF in the Security tab, all free</li>
        <li>Exit code 1 on findings, so it gates CI today</li>
      </ul>
      <div class="fill"></div>
      <div class="run">
        <code id="cmd-free">npx margyn-scan /path/to/repo</code>
        <button data-copy="cmd-free">Copy</button>
      </div>
    </div>

    <div class="tier pick">
      <p class="tag">Watch <span class="paid">most start here</span></p>
      <p class="amt">$8.99<span class="per"> a month, 3 days free</span></p>
      <ul>
        <li>Everything in the free scan</li>
        <li>The mutation proof: it inverts a line, runs your suite, then reports the suite that
          stayed green anyway</li>
        <li>A licence your CI verifies offline, so a paid check runs on a runner with no network</li>
        <li>One repository owner. Cancel whenever you like</li>
      </ul>
      <div class="fill"></div>
      <p class="cta">
        <button id="buylogin" data-signin>Sign in to start the trial</button>
        <button data-buy="watch" hidden>Start the 3 day trial</button>
      </p>
      <p class="sm" id="buynote">3 days free, then $8.99 a month. Checkout runs on Tiun.</p>
      <p class="sm note" id="sandboxnote" hidden></p>
    </div>

    <div class="tier">
      <p class="tag">Team</p>
      <p class="amt">$29<span class="per"> a month, 3 days free</span></p>
      <ul>
        <li>Everything in Watch, for every repository the organisation owns</li>
        <li>One licence covers every CI runner, with no seat count and no phone home</li>
        <li>Your issues are triaged first</li>
        <li>Invoices on request rather than a card</li>
      </ul>
      <div class="fill"></div>
      <p class="cta">
        <button class="ghost" data-signin>Sign in to start</button>
        <button data-buy="team" hidden>Start the 3 day trial</button>
      </p>
      <p class="sm">Still no per seat billing. A CI gate has no seats.</p>
    </div>
  </div>
</div></section>

<section id="fix"><div class="wrap">
  <p class="eyebrow">The service line</p>
  <h2>Or have the findings arrive already fixed</h2>
  <div class="tiers">
    <div class="tier">
      <p class="tag">Solo Fix <span class="paid">the cheap way in</span></p>
      <p class="amt">$19<span class="per"> a month</span></p>
      <ul>
        <li>One finding a month fixed for you</li>
        <li>It arrives as a patch carrying a test that fails before it and passes after</li>
        <li>Back within five working days. Otherwise that month is refunded</li>
        <li>Cancel whenever you like</li>
      </ul>
      <div class="fill"></div>
      <p class="cta">
        <button class="ghost" data-signin>Sign in to start</button>
        <button data-buy="solofix" hidden>Start Solo Fix</button>
      </p>
      <p class="sm">One a month is the honest floor: a real fix is a person writing a patch.</p>
    </div>
    <div class="tier pick">
      <p class="tag">Fix flow</p>
      <p class="amt">$79<span class="per"> a month</span></p>
      <ul>
        <li>Up to three findings a month fixed for you</li>
        <li>Each one arrives as a patch carrying a test that fails before it and passes after</li>
        <li>Back within five working days. Otherwise that month is refunded</li>
        <li>Cancel whenever you like</li>
      </ul>
      <div class="fill"></div>
      <p class="cta">
        <button class="ghost" data-signin>Sign in to start</button>
        <button data-buy="fixflow" hidden>Start Fix flow</button>
      </p>
      <p class="sm">No trial on either, because a trial on a service is unpaid work.</p>
    </div>
  </div>
  <div style="margin-top:18px">
    <h3>It works from the finding, not from your repository</h3>
    <p class="prose">You send the finding, which already carries the file, the line, the rule that
      caused it and the reproduction. We send back a patch. Nobody needs a token that can read
      your source, so the promise on the <a href="/security">security page</a> holds exactly as
      it does for the free scan: your code stays where it is. <b><a href="/fix">Send a finding
      now</a></b>, it takes a paste.</p>
    <p class="prose">If a fix genuinely cannot be written from the finding alone, we say so and it
      does not count against your month. A patch that does not apply is our defect rather than
      your problem.</p>
    <p class="sm prose">This is the honest shape of it: the scan is a tool, the fix is a person
      writing a patch. One or three a month is what a person can do properly, so that is the
      number on the page rather than the word unlimited.</p>
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
    <tr><th>Price</th><td>Watch 8.99 USD a month for one repository owner. Team 29 USD a month for
      an organisation. Solo Fix 19 USD a month for one fixed finding, Fix flow 79 USD a month for up
      to three. No per seat and no per committer billing anywhere: a CI gate has no seats, so
      charging for engineers who never open the tool would be charging for nothing.</td></tr>
    <tr><th>Trial</th><td>Three days at no charge on Watch and Team. Solo Fix and Fix flow have
      none, because a trial on a service is unpaid work.</td></tr>
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

<section id="teams"><div class="wrap">
  <h2>For a team, plus whoever signs off on it</h2>
  <p class="prose">The price is per repository owner rather than per seat, so adding engineers who
    never open the tool costs nothing. One licence covers your CI runners: it is verified offline
    against a key compiled into the binary, so it works on every runner at once without a seat count
    or a phone home.</p>
  <table class="st">
    <tr><th>More than one repository</th><td>That is what <b>Team</b> is: one subscription across
      every repository the organisation owns, at 29 a month. If you need separate billing per team
      or a single invoice across several organisations,
      <a href="https://github.com/zkasuran/margyn/issues">ask</a> and it is set up by hand today
      rather than by a form.</td></tr>
    <tr><th>Invoices, annual terms, purchase orders</th><td>Card checkout is what is automated. An
      annual arrangement or an invoice is a conversation, so ask before you subscribe rather than
      after.</td></tr>
    <tr><th>Procurement review</th><td>Everything a reviewer normally asks for is already written
      down: <a href="/security">every process the scanner starts</a>, the absence of a hosted scan
      endpoint, what the licence carries, plus <a href="https://github.com/zkasuran/margyn">the
      source</a> under MIT so it can be read before it runs.</td></tr>
    <tr><th>Support</th><td><a href="https://github.com/zkasuran/margyn/issues">Repository
      issues</a>, in public, which is a channel you can check is answered before you pay. A finding
      you cannot reproduce is treated as a defect in the tool rather than a question about your
      repository.</td></tr>
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
