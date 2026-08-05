/**
 * The site is eight files generated from eight modules, so the thing that can go
 * wrong is drift: an edited HTML file nobody regenerated, a nav entry pointing at
 * a page that was never written, a heading id renamed with the links left behind.
 *
 * A dead internal link is the web's version of an unrun check. Nothing fails, the
 * page still returns 200, then the only symptom is a visitor landing on a 404 from
 * the footer of a page that takes money. So every link on this site is resolved
 * here, against the files that actually exist.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { SITE, shell } from "../web/layout.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PAGES = join(here, "..", "web", "pages");
const PUBLIC = join(here, "..", "web", "public");

const modules = readdirSync(PAGES).filter((f) => f.endsWith(".mjs")).sort();
const pages = [];
for (const file of modules) pages.push((await import(join(PAGES, file))).default);

/**
 * Deliberately not imported from bin/build-pages.mjs. A test that reuses the
 * mapping it is checking cannot catch a mutation in that mapping, which is the
 * hollow shape this product reports.
 */
const fileOf = (path) => (path === "/" ? "index.html" : `${path.slice(1)}.html`);
const html = new Map(pages.map((p) => [p.path, readFileSync(join(PUBLIC, fileOf(p.path)), "utf8")]));

test("every page module has a built file that matches it exactly", () => {
  assert.ok(pages.length >= 8, `only ${pages.length} pages found, so this test is checking nothing`);
  for (const page of pages) {
    assert.equal(
      html.get(page.path),
      shell(page),
      `${fileOf(page.path)} does not match web/pages, so run npm run pages`,
    );
  }
});

test("every page carries the head a page needs to be shareable", () => {
  for (const page of pages) {
    const doc = html.get(page.path);
    const canonical = SITE.origin + (page.path === "/" ? "/" : page.path);
    assert.match(doc, /<title>[^<]{10,100}<\/title>/, `${page.path} has no usable title`);
    assert.ok(doc.includes(`<meta name="description" content="`), `${page.path} has no description`);
    assert.ok(doc.includes(`<link rel="canonical" href="${canonical}">`), `${page.path} canonical is wrong`);
    assert.ok(doc.includes(`<meta property="og:image" content="${SITE.origin}/og.png">`), `${page.path} has no og image`);
    assert.equal((doc.match(/<h1[\s>]/g) ?? []).length, 1, `${page.path} needs exactly one h1`);
    // Description length is a real limit: a search result truncates near 160.
    const description = doc.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(description.length <= 250, `${page.path} description is ${description.length} characters`);
  }
});

test("every internal link resolves to a page or an asset that exists", () => {
  const assets = new Set(readdirSync(PUBLIC).map((f) => `/${f}`));
  const built = new Set(pages.map((p) => p.path));
  let checked = 0;

  for (const page of pages) {
    for (const [, href] of html.get(page.path).matchAll(/href="([^"]+)"/g)) {
      if (!href.startsWith("/") && !href.startsWith("#")) continue;
      if (href.startsWith("//")) continue;
      checked += 1;
      const [path, fragment] = href.startsWith("#") ? [page.path, href.slice(1)] : href.split("#");
      const resolves = built.has(path) || assets.has(path) || assets.has(`${path}.html`);
      assert.ok(resolves, `${page.path} links to ${href}, which is not a page or an asset`);
      if (!fragment) continue;
      // An anchor into a page that has no such id lands the reader at the top with
      // no error, which is the quietest broken link there is.
      const target = built.has(path) ? html.get(path) : null;
      if (!target) continue;
      assert.ok(
        target.includes(`id="${fragment}"`),
        `${page.path} links to ${href} but ${path} has no id="${fragment}"`,
      );
    }
  }
  assert.ok(checked > 40, `only ${checked} internal links checked, so the parser found nothing`);
});

test("the nav and footer reach every page, so nothing is orphaned", () => {
  const linked = new Set();
  for (const page of pages) {
    for (const [, href] of html.get(page.path).matchAll(/href="(\/[^"#]*)/g)) linked.add(href);
  }
  for (const page of pages) {
    if (page.noindex) continue;
    assert.ok(linked.has(page.path), `${page.path} exists but nothing links to it`);
  }
});

test("the sitemap holds every indexable page and nothing else", () => {
  const sitemap = readFileSync(join(PUBLIC, "sitemap.xml"), "utf8");
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const want = pages.filter((p) => !p.noindex).map((p) => SITE.origin + (p.path === "/" ? "/" : p.path));
  assert.deepEqual(listed.sort(), want.sort(), "the sitemap and the page list disagree");
  for (const page of pages.filter((p) => p.noindex)) {
    assert.ok(html.get(page.path).includes('name="robots" content="noindex"'), `${page.path} is out of the sitemap but not marked noindex`);
    assert.ok(!sitemap.includes(`${page.path}<`), `${page.path} is noindex yet listed in the sitemap`);
  }
});

test("robots.txt points at the sitemap that exists", () => {
  const robots = readFileSync(join(PUBLIC, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*$/m);
  assert.ok(robots.includes(`Sitemap: ${SITE.origin}/sitemap.xml`), "robots.txt does not name the sitemap");
  assert.ok(existsSync(join(PUBLIC, "sitemap.xml")), "robots.txt names a sitemap that is not there");
});

test("the styles are one file, so two pages cannot drift apart", () => {
  const styleOf = (doc) => doc.slice(doc.indexOf("<style>"), doc.indexOf("</style>"));
  const first = styleOf(html.get("/"));
  assert.ok(first.length > 4000, "the inline stylesheet is suspiciously short");
  for (const page of pages) {
    assert.equal(styleOf(html.get(page.path)), first, `${page.path} carries different CSS from the home page`);
  }
});
