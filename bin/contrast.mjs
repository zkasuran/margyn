/**
 * The palette, with every contrast ratio computed rather than eyeballed.
 *
 * Run `node bin/contrast.mjs` and it prints every text-on-surface pair in both
 * modes and exits 1 if any of them misses its WCAG target. So the palette in
 * index.html cannot drift into being unreadable without the check going red.
 *
 * The tokens here are the source of truth. If you change a colour in the CSS,
 * change it here too and re-run this. The two are kept in step by
 * `test/palette.test.mjs`, which parses the real CSS and compares.
 */

/** WCAG 2.1 relative luminance. The 0.03928 threshold and the 2.4 exponent are the spec's. */
function luminance(hex) {
  const h = hex.replace("#", "");
  const channel = (i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** Contrast ratio, lighter over darker, both offset by 0.05. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const LIGHT = {
  bg: "#FBFAF8", card: "#FFFFFF", rais: "#F5F3EF",
  ink: "#17181C", mut: "#5A5C66", faint: "#686A72",
  line: "#E4E1DB", line2: "#D2CEC6", strong: "#8F8878",
  accent: "#0F5C4E", hi: "#A33A16", ok: "#1F6B4A",
};

export const DARK = {
  bg: "#0E0F12", card: "#16181C", rais: "#1D2025",
  ink: "#F0F1F3", mut: "#A2A5AE", faint: "#8A8D96",
  line: "#262A30", line2: "#343941", strong: "#5F6874",
  accent: "#57C9AE", hi: "#FF9366", ok: "#5FD3A3",
};

const SURFACES = ["bg", "card", "rais"];
const TEXT = ["ink", "mut", "faint", "accent", "hi", "ok"];

/**
 * Every pair that carries meaning, with the level it must clear.
 *
 * 4.5 for all body text including `faint`, which is stricter than WCAG needs for
 * large text. Small grey print is exactly where a palette gets away with being
 * unreadable, so it is held to the body standard.
 *
 * `strong` is the input and control border, which is a non-text UI component, so
 * it needs 3.0 under SC 1.4.11. `line` and `line2` are decorative hairlines that
 * never carry information on their own, so they are exempt and not checked.
 */
export function audit(tokens) {
  const rows = [];
  for (const t of TEXT) {
    for (const s of SURFACES) {
      rows.push({ pair: `${t} on ${s}`, fg: tokens[t], bg: tokens[s], ratio: contrast(tokens[t], tokens[s]), need: 4.5 });
    }
  }
  rows.push({ pair: "button label on ink", fg: tokens.bg, bg: tokens.ink, ratio: contrast(tokens.bg, tokens.ink), need: 4.5 });
  rows.push({ pair: "control border on bg", fg: tokens.strong, bg: tokens.bg, ratio: contrast(tokens.strong, tokens.bg), need: 3 });
  rows.push({ pair: "focus ring on bg", fg: tokens.ink, bg: tokens.bg, ratio: contrast(tokens.ink, tokens.bg), need: 3 });
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let failed = 0;
  for (const [name, tokens] of [["LIGHT", LIGHT], ["DARK", DARK]]) {
    console.log(`\n${name}`);
    for (const r of audit(tokens)) {
      const ok = r.ratio >= r.need;
      if (!ok) failed += 1;
      console.log(`  ${ok ? "pass" : "FAIL"}  ${r.ratio.toFixed(2).padStart(5)}  need ${r.need}  ${r.pair.padEnd(22)} ${r.fg} on ${r.bg}`);
    }
  }
  // Known-good values from the WCAG literature, so a broken luminance function is
  // caught here rather than silently blessing an unreadable palette.
  const checks = [["#767676", "#FFFFFF", 4.54], ["#595959", "#FFFFFF", 7.0], ["#000000", "#FFFFFF", 21.0]];
  for (const [a, b, want] of checks) {
    const got = contrast(a, b);
    if (Math.abs(got - want) > 0.01) {
      console.error(`\nluminance is wrong: ${a} on ${b} gave ${got.toFixed(3)}, expected ${want}`);
      failed += 1;
    }
  }
  console.log(failed === 0 ? "\nevery pair clears its target, and the implementation matches known values" : `\n${failed} failing`);
  process.exitCode = failed === 0 ? 0 : 1;
}
