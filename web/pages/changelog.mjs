/**
 * Changelog. Every entry is a real commit on a real date, so the dates come from
 * git rather than from memory. Version numbers start at 0.1.0 because that is the
 * first release published to npm; the earlier entries are dated, not versioned.
 */
export default {
  path: "/changelog",
  title: "Margyn changelog",
  description:
    "What shipped and when. Six checks, a suggestion box, an offline licence, a Cloudflare Worker with no scan endpoint, then the site and the first npm release.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Changelog</h1>
  <p class="lede prose">Dates come from the commits, not from memory. Version numbers start at
    0.1.0, which is the first release on npm. Everything before that is dated instead of
    versioned, because pretending there were tags would be inventing history.</p>
</div></section>

<section><div class="wrap">
  <div class="rel">
    <p class="when">2026-08-15<br>site</p>
    <div>
      <h3>A suggestion box, for the finding you think is wrong</h3>
      <p><b><a href="/suggest">A box for feedback and feature requests</a>.</b> Six checks is a
        deliberate number rather than a finished one. The most useful message this project gets is a
        finding somebody disagrees with. So there is a form for it now: pick feedback or a feature,
        say the thing, leave a contact if you want a reply.</p>
      <p>It stores nothing, for the same reason <a href="/fix">the fix intake</a> stores nothing. What
        you type is validated, given a deterministic reference and turned into a prefilled issue on
        the public repository, which you submit under your own account. That makes the request yours
        to watch and ours to answer in public. It also means there is no inbox on this side to fill
        up and no database of other people's ideas to guard. The security page carries the curl that
        shows what the endpoint returns. The privacy page now says what both forms do with what you
        type.</p>
      <p>One detail worth writing down for anyone building the same thing. The prepared link carries a
        title and a body and no <code>labels</code> parameter, because GitHub only honours that
        parameter for someone who has permission to label an issue, then treats a label the
        repository does not have as an invalid URL. Either one answers with a 404, which would have
        made the single click this design rests on a dead end for exactly the people it is for. The
        kind is in the title and the label is applied at triage.</p>
      <p>The same review found three ways to reach a 500 rather than an error message, all of them in
        the shape the fix intake had been using since it shipped: a slice that cut an emoji in half so
        the encoder threw, a finding field that was not a string, then both calls sitting outside the
        try that catches the body reader. Fixed in one shared module both forms now use, with the
        crash cases as tests.</p>
      <p>The CLI did not change, so there is no new npm release. The version numbers on this page are
        the package's.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">0.3.0<br>2026-08-15</p>
    <div>
      <h3>A sixth check, for tests that assert something that cannot be false</h3>
      <p><b><code>cannot-fail</code>.</b> <code>no-assertion</code> reports an empty test body. This
        one reports the harder case, a body full of assertions that hold whatever the code does: a
        literal answered inside a catch, an assertion swallowed by a catch that cannot fail the test,
        a deliberate fail marker whose catch is satisfied by the marker's own error, a status list
        that accepts both the success and the failure. Every shape was measured against real
        repositories before it shipped, and two more were measured and dropped. A top level
        <code>||</code> in an assertion was right twice in 110 real sites. An empty catch on its own
        was wrong fourteen times out of fourteen. Neither is a knob left off, both are rules that
        would have cried wolf.</p>
      <p>The first draft reported 41 findings on fastify and 39 of them were wrong, all under
        <code>t.plan(n)</code>, where the declared count normally catches the swallowed assertion
        itself. That gate is in the check and in the tests. What is left on fastify is two, and both
        are real.</p>
      <p><b>A test title is not an assertion.</b> The loose assertion matcher read the word "should"
        wherever it appeared, so every test whose title began "should ..." was treated as asserting.
        Comments, string contents and regular expression bodies are now blanked before anything is
        matched, and the title with them. That found a seventh hollow test in fastify and stopped
        this repository's own CLI test from reporting itself, since it writes a test into a fixture
        as a string. The proof command carried the same fault and disagreed with the check that
        emitted it, which is how it was caught: the finding appeared and its own proof withdrew it.</p>
      <p><b>Every mutation this tool can make is now caught by its own suite.</b> 63 tests became 93,
        and the eight survivors it reported on itself are gone. <a href="/proof#itself">The run is on
        the proof page</a>, with what each test pins.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">0.2.1<br>2026-08-15</p>
    <div>
      <h3>Twenty two false positives, found by pointing Margyn at other people's repositories</h3>
      <p><b>Build output is no longer reported as missing source.</b> Scanned five real projects and
        every <code>ignored-source</code> finding on four of them was wrong. A Vite app's committed
        assets were matched against the copies the build left in <code>dist</code>. A Foundry project's
        artefacts under <code>contracts/out</code> were reported although its own
        <code>foundry.toml</code> declares that directory. A bundler's output was reported because the
        build script that writes it also names it. All 22 passed proof mode too, which is the part
        worth saying out loud: the proof asked whether that path was committed, when the question is
        whether anything in the commit answers the path the reader asks for.</p>
      <p>So a reference is now resolved against everything git has. A finding is only reported for a
        path that no committed file answers. The proof asks that question, so a finding that slips
        through
        retracts itself rather than failing a build on a copy of a committed file. On top of that,
        output a tool in the repository declares it writes is skipped: <code>out</code> from
        <code>foundry.toml</code>, a <code>vite</code>, <code>next</code> or <code>cargo</code> build
        from the script that runs it, an <code>outdir</code> in a build script, an
        <code>outDir</code> in a <code>tsconfig</code>. Read from declarations and resolved to real
        paths, never from a directory being called <code>dist</code>, because the defect this check
        was written from was vendored source in <code>vendor/dist</code> and that one still fires.</p>
      <p><b>A help link that pointed at nothing.</b> Every SARIF rule carries a
        <code>helpUri</code> into these docs, and the mutation rule's has always missed: it links
        <code>/docs#mutation</code> while the heading carried <code>id="mutation-check"</code>, so a
        reader in the Security tab landed at the top of a long page. Fixed, with a test that resolves
        the help link of every check the scanner can emit. The existing links test could not catch it,
        because the site never links that fragment itself.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">0.2.0<br>2026-08-12</p>
    <div>
      <h3>Margyn runs its own reproductions, posts them on your PR, and gains a cheaper way in</h3>
      <p><b>Proof mode, <code>--prove</code>.</b> Every finding already ships a reproduction. Now
        Margyn runs it. For each finding it executes the read-only proof its check emitted, checks the
        output carries the markers it predicted, and marks it reproduced. A finding it cannot
        reproduce is retracted and dropped, so a gate never fails a build on a claim the tool could
        not show on your tree. The mutation proof reports as observed, because running your suite is
        how it was established. It is free, because a finding you can watch reproduce is the whole
        product.</p>
      <p><b>Findings on the pull request.</b> The action can now write a job summary every run, keep
        one pull-request comment updated in place, and upload SARIF to the Security tab. It uses the
        job's own token, so nothing is hosted and no secret leaves the repository. New CLI outputs
        <code>--sarif-out</code> and <code>--comment-out</code> back it, and both are one scan, so the
        mutation proof never runs twice.</p>
      <p><b>Fix flow has an intake, and a cheaper tier.</b> <a href="/fix">A page</a> takes a finding,
        works from it rather than your repository, and prepares a tracked request without ever
        carrying the code snippet a finding sometimes holds. <b>Solo Fix, 19 USD a month</b>, is one
        fixed finding a month, the cheap way in below Fix flow's three. A real fix is a person writing
        a patch, so one a month is the honest floor rather than a number chosen to look small.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">2026-08-06<br>later</p>
    <div>
      <h3>Two more ways to buy, one of which is a person rather than a binary</h3>
      <p><b>Team, 29 USD a month</b>, is Watch for every repository an organisation owns, with issues
        triaged first and invoices instead of a card on request. It expands into the same capability
        Watch grants, because a customer on the larger plan finding the paid check locked would be
        the worst bug to ship in a billing path. That expansion now lives in one module both hosts
        import, with a test naming each rule, rather than as a copy in each of them.</p>
      <p><b>Fix flow, 79 USD a month</b>, is up to three findings a month fixed for you, each
        returned as a patch carrying a test that fails before it and passes after. It works from the
        finding rather than from your repository, so it needs no token, no clone and no repository
        access, which keeps the promise on the security page intact. Three is the ceiling because
        three is what one person can do properly in a month, so that is the number on the page
        instead of the word unlimited.</p>
      <p>The pricing page carries all three, checkout is wired per product rather than to one hard
        coded id, then the terms say exactly what the service delivers plus what happens when it is
        late.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">0.1.2<br>2026-08-06</p>
    <div>
      <h3>Seven false positives found on a real repository, then fixed</h3>
      <p>The scan was run over five public repositories to replace a precision claim nobody could
        reproduce. It reported 17 findings on fastify at <code>39e87e8</code>. Seven of them
        were wrong: the tests in <code>test/trust-proxy.test.js</code> declare
        <code>t.plan(11)</code> then assert through a helper that takes the test context. A planned
        count fails the test when it comes up short, so a body carrying one cannot be hollow.</p>
      <p><code>no-assertion</code> now counts a declared assertion count as an assertion, plus any
        helper handed the test context. Both directions are tested. fastify reports 10 rather than
        17. The six tests that remain each name a file and a line you can open.</p>
      <p>The finding itself was overclaiming too. It said a test with no assertion "cannot fail",
        which is wrong for a test whose failure mode is an exception. It now says nothing but a
        thrown error can fail it, which is what is actually true.</p>
      <p>The whole run, with every commit, is on the <a href="/proof">proof page</a>. It replaces
        the older 132 to 0 precision table, which was true but named none of its repositories, so
        nobody could repeat it.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">0.1.1<br>2026-08-06</p>
    <div>
      <h3>First published release, plus a site instead of a page</h3>
      <p>On npm as <code>margyn-scan</code>, so <code>npx margyn-scan /path/to/repo</code> resolves
        for anyone. npm refuses the name <code>margyn</code> as too close to an existing package
        called morgan, so the package carries a suffix while the command it installs stays
        <code>margyn</code>. 0.1.0 went out first then was replaced within the hour, because its
        README still printed the name we turned out not to be allowed. The tarball carries
        <code>src</code>, the README and the licence, nothing else.</p>
      <p>The CLI grew <code>--help</code>, <code>--version</code> and <code>--max</code>. The last
        one is what makes "raise the cap" a sentence you can act on rather than an option only
        reachable by importing the checker.</p>
      <p>Two pages scrolled sideways on a phone. Measured in a headless browser at 360 and 390
        pixels: the docs grid took its width from the 680 pixel prose measure, then the pricing card
        took its width from the nowrap install command. Both are fixed, both were re-measured, so
        all eight pages now fit a 360 pixel screen.</p>
      <p>The pricing page now says which Tiun environment its buttons are wired to. While the live
        account finishes onboarding, checkout runs in the sandbox, so the page says that where
        someone is about to press a buy button rather than leaving them to find out.</p>
      <p>The site went from one page to eight, all built through one shell: docs, pricing,
        changelog, security, terms, privacy and a real 404. Paths are served without the
        <code>.html</code>. Both <code>sitemap.xml</code> and <code>robots.txt</code> are generated
        from the same page list, so a new page cannot be shipped and left out of the sitemap.</p>
      <p>Corrected our own self audit. The home page had named <code>bin/bundle-static.mjs</code> as
        a surviving mutant, from a run against an older tree. That file no longer carries a line
        this checker knows how to invert, because the line it inverted went away when the bundler
        was rewritten. At the default cap of four, four of four now survive. The suite is 41 tests,
        not the 26 the older copy claimed.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">2026-08-05</p>
    <div>
      <h3>Live on margyn.xyz, with the scanner deliberately left out</h3>
      <p>The hosted half runs on Cloudflare Workers: the page, sign in, checkout and the licence
        endpoint. There is no <code>/api/scan</code> in production. On a public host that route
        would take a filesystem path from a stranger and run git against it.</p>
      <p>The mutation proof became a paid check behind an Ed25519 licence that the CLI verifies
        offline. A refusal prints the reason then runs the free scan in full, so billing can never
        fail a build. The Worker signs with WebCrypto, the local server signs with
        <code>node:crypto</code>. A test asserts the two produce identical bytes rather than
        merely both being valid.</p>
      <p>The product was renamed from Placebo to Margyn. The palette became a gate: every text
        pair is measured against WCAG in both colour schemes and the build fails on a miss.</p>
    </div>
  </div>

  <div class="rel">
    <p class="when">2026-08-01</p>
    <div>
      <h3>Five checks, written from a pull request that went red</h3>
      <p>Eight vendored modules sat under a path containing <code>dist/</code>, which the root
        ignore file excludes at any depth, so git dropped all eight while they sat on disk. The
        first two checks came straight out of that failure. Then three more, from the same
        question: what else in this repository reads as verification and performs none?</p>
      <p>Then the precision pass, because a scanner that cries wolf is hollow itself. The first run
        produced 132 findings on one repository and nearly all were wrong. Four fixes later the
        same five repositories gave 0, 2, 2, 2 and 0 findings. The eight that remain are
        true.</p>
    </div>
  </div>
</div></section>

<section><div class="wrap">
  <h2>What is not built</h2>
  <p class="prose">Named here so the roadmap is checkable rather than implied.</p>
  <ul class="prose">
    <li>An assertion that cannot fail for a subtler reason than having none, for example a fixture
      hash written by hand instead of generated. We hit exactly that case on 2026-08-01 and it is
      still a human's job.</li>
    <li>Local against CI environment divergence.</li>
    <li>Generating the fix rather than naming the defect.</li>
  </ul>
  <p class="sm prose">A hosted scan is not on this list. That one is a decision rather than a gap,
    and the reasoning is on the <a href="/security">security page</a>.</p>
</div></section>
`,
};
