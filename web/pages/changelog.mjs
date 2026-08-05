/**
 * Changelog. Every entry is a real commit on a real date, so the dates come from
 * git rather than from memory. Version numbers start at 0.1.0 because that is the
 * first release published to npm; the earlier entries are dated, not versioned.
 */
export default {
  path: "/changelog",
  title: "Margyn changelog",
  description:
    "What shipped and when. Five checks, an offline licence, a Cloudflare Worker with no scan endpoint, then the site and the first npm release.",
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">Changelog</h1>
  <p class="lede prose">Dates come from the commits, not from memory. Version numbers start at
    0.1.0, which is the first release on npm. Everything before that is dated instead of
    versioned, because pretending there were tags would be inventing history.</p>
</div></section>

<section><div class="wrap">
  <div class="rel">
    <p class="when">0.1.0<br>2026-08-06</p>
    <div>
      <h3>First published release, plus a site instead of a page</h3>
      <p>On npm, so <code>npx margyn /path/to/repo</code> resolves for anyone. The published
        tarball carries <code>src</code>, the README and the licence, nothing else.</p>
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
