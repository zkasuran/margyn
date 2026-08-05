/** The 404. Noindex, because a page that says nothing exists here should not rank. */
export default {
  path: "/404",
  title: "Not found: Margyn",
  description: "That page does not exist on margyn.xyz.",
  noindex: true,
  body: `
<section class="phead"><div class="wrap">
  <h1 class="prose">That page is not here.</h1>
  <p class="lede prose">An unknown path answers 404 rather than quietly serving the home page, so a
    broken link fails loudly instead of looking fine.</p>
</div></section>

<section><div class="wrap">
  <h2>Where you probably meant to go</h2>
  <ul class="prose">
    <li><a href="/">The product, plus a real finding from a real run</a></li>
    <li><a href="/docs">Documentation: install, the five checks, CI, licences</a></li>
    <li><a href="/pricing">Pricing</a></li>
    <li><a href="/changelog">Changelog</a></li>
    <li><a href="/security">Security model</a></li>
  </ul>
  <div class="run">
    <code id="cmd-404">npx margyn /path/to/repo</code>
    <button data-copy="cmd-404">Copy</button>
  </div>
</div></section>
`,
};
