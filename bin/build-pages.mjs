/**
 * Builds every page from web/pages/*.mjs through the shared shell.
 *
 * The site is one static HTML file per module in web/pages, with inline CSS and no
 * runtime framework. This step exists so the head, the bar and the footer live in
 * one place rather than in every page, which is the difference between a site and a
 * pile of pages that resemble each other. Output goes to web/public and the bundler
 * carries it from there. No count is written down here: it would go stale the next
 * time a page ships, which is the drift this repository reports about others.
 *
 * It also writes sitemap.xml and robots.txt from the same page list, so a new
 * page cannot be published and left out of the sitemap. A hand-maintained
 * sitemap is an unrun check: nothing fails when it goes stale.
 *
 * Run `npm run pages`, which `npm run build` does for you.
 */
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, shell } from "../web/layout.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PAGES = join(here, "..", "web", "pages");
const OUT = join(here, "..", "web", "public");

/** `/` is index.html, everything else is a flat file the worker maps by path. */
export const fileFor = (path) => (path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`);

/** Writes every page, then the sitemap and robots.txt from the same list. */
export async function buildPages() {
  const files = readdirSync(PAGES).filter((f) => f.endsWith(".mjs")).sort();
  const pages = [];
  let total = 0;

  for (const file of files) {
    const page = (await import(join(PAGES, file))).default;
    const html = shell(page);
    const name = fileFor(page.path);
    writeFileSync(join(OUT, name), html);
    total += Buffer.byteLength(html);
    pages.push(page);
    console.log(`  ${page.path.padEnd(12)} -> ${name.padEnd(16)} ${Buffer.byteLength(html)} bytes`);
  }

  // Only indexable pages go in the sitemap. `lastmod` is deliberately absent: a
  // date that is not the real edit date is worse than no date at all.
  const indexable = pages.filter((p) => !p.noindex).map((p) => SITE.origin + (p.path === "/" ? "/" : p.path));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>
`;
  writeFileSync(join(OUT, "sitemap.xml"), sitemap);

  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE.origin}/sitemap.xml
`;
  writeFileSync(join(OUT, "robots.txt"), robots);

  console.log(`${files.length} pages, ${total} bytes`);
  console.log(`  sitemap.xml  ${indexable.length} urls`);
  console.log(`  robots.txt   written`);
}

/**
 * Importing this module must not write anything. The pages test imports `fileFor`
 * to check it against its own mapping, and a build that ran as a side effect of
 * that import rewrote the whole site from whatever state the tree was in. Under
 * the mutation proof it did exactly that: `path === "/"` inverted, imported by a
 * test, and web/public/.html appeared while every page went to the wrong file.
 */
if (import.meta.url === `file://${process.argv[1]}`) await buildPages();
