/**
 * The palette in the page and the palette in the contrast gate must be the same
 * palette.
 *
 * bin/contrast.mjs proves every pair is readable. That proof is worthless if the
 * CSS quietly holds different hex values, so this test parses the real custom
 * properties out of index.html and compares them token by token. A colour tweaked
 * in the page without re-running the gate turns this red.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { DARK, LIGHT, audit, contrast } from "../bin/contrast.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PAGE = join(here, "..", "web", "public", "index.html");

/** Pulls `--name: light-dark(#light, #dark);` pairs out of the token block. */
function tokensIn(css) {
  const light = {};
  const dark = {};
  for (const [, name, l, d] of css.matchAll(
    /--([a-z0-9-]+)\s*:\s*light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)/g,
  )) {
    light[name] = l.toUpperCase();
    dark[name] = d.toUpperCase();
  }
  return { light, dark };
}

test("the contrast gate agrees with itself on known WCAG values", () => {
  // If this fails, every other number in the gate is meaningless.
  assert.ok(Math.abs(contrast("#767676", "#FFFFFF") - 4.54) < 0.01);
  assert.ok(Math.abs(contrast("#595959", "#FFFFFF") - 7.0) < 0.01);
  assert.equal(Math.round(contrast("#000000", "#FFFFFF")), 21);
});

test("every text pair clears 4.5 to 1 in both modes", () => {
  for (const [mode, tokens] of [["light", LIGHT], ["dark", DARK]]) {
    for (const row of audit(tokens)) {
      assert.ok(
        row.ratio >= row.need,
        `${mode}: ${row.pair} is ${row.ratio.toFixed(2)} to 1, needs ${row.need} (${row.fg} on ${row.bg})`,
      );
    }
  }
});

test("the page's own custom properties match the audited palette", () => {
  const html = readFileSync(PAGE, "utf8");
  // One block holds both modes, because light-dark() reads the used colour
  // scheme. That is the point: there is no second block to drift out of step.
  const root = html.match(/:root\s*\{([\s\S]*?)\}/);
  assert.ok(root, "no :root block found in index.html");
  const got = tokensIn(root[1]);

  for (const [mode, want] of [["light", LIGHT], ["dark", DARK]]) {
    for (const [name, hex] of Object.entries(want)) {
      assert.equal(
        got[mode][name],
        hex.toUpperCase(),
        `${mode} --${name} is ${got[mode][name] ?? "missing"} in index.html but ${hex} in the contrast gate`,
      );
    }
  }
});
