/**
 * The bundle must be byte-identical to what is on disk.
 *
 * This test exists because it was not caught by anything else. An earlier bundler
 * read every file as utf8, so both PNGs were silently corrupted: bytes that are
 * not valid utf8 become U+FFFD, and `og.png` went in at 13,445 bytes and came out
 * as 12,703 characters. Nothing threw, the page still served a 200, and the only
 * symptom would have been a broken link preview on every platform that fetched
 * it.
 *
 * A build step with no assertion about its own output is an unrun check, which is
 * one of the five defects this product reports. So the fidelity is asserted here.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { TYPES } from "../bin/bundle-static.mjs";
import { STATIC } from "../worker/static.generated.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(here, "..", "web", "public");

const onDisk = readdirSync(PUBLIC, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name);

test("every file in web/public is in the bundle", () => {
  for (const name of onDisk) {
    assert.ok(STATIC[`/${name}`], `/${name} is on disk but missing from the bundle, so run npm run worker:bundle`);
  }
  assert.equal(Object.keys(STATIC).length, onDisk.length, "the bundle holds an entry with no file behind it");
});

test("every bundled file is byte-identical to the file on disk", () => {
  for (const [path, entry] of Object.entries(STATIC)) {
    const raw = readFileSync(join(PUBLIC, path.slice(1)));
    const restored = entry.binary ? Buffer.from(entry.body, "base64") : Buffer.from(entry.body, "utf8");
    assert.equal(restored.length, raw.length, `${path} is ${restored.length} bytes in the bundle and ${raw.length} on disk`);
    assert.ok(restored.equals(raw), `${path} does not round trip, so its bytes were changed by bundling`);
    assert.equal(entry.bytes, raw.length, `${path} records the wrong size`);
  }
});

test("no file is served as octet-stream, and images are declared binary", () => {
  for (const [path, entry] of Object.entries(STATIC)) {
    assert.ok(entry.type, `${path} has no content type`);
    assert.ok(!entry.type.includes("octet-stream"), `${path} would be served as octet-stream`);
    const spec = TYPES[extname(path)];
    assert.equal(entry.type, spec.type, `${path} has the wrong content type`);
    assert.equal(entry.binary, spec.binary, `${path} has the wrong encoding flag`);
  }
});

test("the PNGs still carry a real PNG signature after the round trip", () => {
  // The corruption this test was written for replaced the first non-ascii byte,
  // which is inside the 8 byte signature, so checking it catches the whole class.
  const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const pngs = Object.entries(STATIC).filter(([p]) => p.endsWith(".png"));
  assert.ok(pngs.length > 0, "no PNGs in the bundle, so this test is not checking anything");
  for (const [path, entry] of pngs) {
    const restored = Buffer.from(entry.body, "base64");
    assert.ok(restored.subarray(0, 8).equals(SIGNATURE), `${path} is not a valid PNG after bundling`);
  }
});

test("the bundle is current, so a stale generated module cannot ship", () => {
  // Regenerating is cheap; shipping a page that does not match its source is not.
  for (const name of onDisk) {
    const raw = readFileSync(join(PUBLIC, name));
    const entry = STATIC[`/${name}`];
    assert.equal(entry.bytes, raw.length, `/${name} changed since the last bundle, so run npm run worker:bundle`);
  }
});
