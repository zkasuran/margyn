/**
 * Generates the favicon, the touch icon, the square logo, the OG card and the
 * product card.
 *
 * Every image on this site is drawn here from the palette in bin/contrast.mjs.
 * Nothing is downloaded and nothing is a screenshot with text pasted on, so
 * there is no image licence to defend and no stale asset to explain.
 *
 * Run `npm run assets`. The SVG is written directly; the rasters need PIL, so
 * this shells out to python3 and says so if it is missing rather than shipping a
 * page that references a file that is not there.
 *
 * logo-512.png and card.png are the two sizes anything outside this site asks
 * for: a square avatar that has to survive being drawn at 28px, and a 1200x630
 * card. They are generated here rather than exported from a design tool so the
 * mark cannot drift from the favicon, and so a claim on the card is a claim this
 * repository can be checked against.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LIGHT } from "./contrast.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "web", "public");

/**
 * The mark: a bracket with a gap in it.
 *
 * The product finds what is missing, so the logo is a shape with something
 * absent from it rather than a checkmark or a shield. Both of those claim the
 * opposite of what this tool does.
 *
 * The gap is centred on the mark's own middle. It used to sit a unit and a
 * quarter low, which read as a drawing mistake rather than a hole on purpose.
 * At 16px the gap is under two pixels, so the small sizes stay two colours and
 * only the sizes that can carry it (logo-512, the cards) flag the gap in rust.
 */
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${LIGHT.accent}"/>
  <path d="M12.5 8.5 H9 V13.75" stroke="${LIGHT.bg}" stroke-width="2.6" fill="none" stroke-linecap="square"/>
  <path d="M9 18.25 V23.5 H12.5" stroke="${LIGHT.bg}" stroke-width="2.6" fill="none" stroke-linecap="square"/>
  <path d="M19.5 8.5 H23 V23.5 H19.5" stroke="${LIGHT.bg}" stroke-width="2.6" fill="none" stroke-linecap="square"/>
</svg>
`;

writeFileSync(join(OUT, "favicon.svg"), MARK);
console.log("favicon.svg");

const py = `
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("PIL is not installed, so the raster assets were not written. pip install Pillow")

OUT = ${JSON.stringify(OUT)}
BG, INK, MUT, ACCENT, CARD, LINE, HI = ${JSON.stringify([LIGHT.bg, LIGHT.ink, LIGHT.mut, LIGHT.accent, LIGHT.card, LIGHT.line, LIGHT.hi])}

def font(path, size):
    return ImageFont.truetype(path, size)

SANS  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD  = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO  = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

def mark(d, x, y, s, fg, bg):
    """The same bracket as the SVG, drawn at scale s."""
    d.rounded_rectangle([x, y, x + s, y + s], radius=int(s * 0.22), fill=fg)
    w = max(2, int(s * 0.08))
    u = s / 32.0
    def seg(pts):
        d.line([(x + a * u, y + b * u) for a, b in pts], fill=bg, width=w, joint="curve")
    seg([(12.5, 8.5), (9, 8.5), (9, 13.75)])
    seg([(9, 18.25), (9, 23.5), (12.5, 23.5)])
    seg([(19.5, 8.5), (23, 8.5), (23, 23.5), (19.5, 23.5)])

def pair(d, cx, cy, width, stroke, fg, gap=5.0, flag=None, margin=0.0):
    """
    The bracket pair at any size, centred on cx, cy.

    Every segment is axis aligned, so each one is a rectangle grown by half a
    stroke on all four sides. That gives projecting caps and mitred corners
    exactly, which PIL's line joints only approximate, and it keeps the edges on
    whole pixels at the sizes that matter.

    width is the outer width including the stroke. gap is the hole in the left
    bracket in grid units, centred on the mark's middle. flag fills the hole,
    which is the one place the third colour is allowed: it points at the thing
    that is missing rather than certifying that nothing is.
    """
    u = (width - stroke) / 14.0
    h = stroke / 2.0
    X = lambda n: cx + (n - 16) * u
    Y = lambda n: cy + (n - 16) * u
    g0, g1 = 16 - gap / 2.0, 16 + gap / 2.0
    for (ax, ay), (bx, by) in [
        ((12.5, 8.5), (9, 8.5)), ((9, 8.5), (9, g0)),
        ((9, g1), (9, 23.5)), ((9, 23.5), (12.5, 23.5)),
        ((19.5, 8.5), (23, 8.5)), ((23, 8.5), (23, 23.5)), ((23, 23.5), (19.5, 23.5)),
    ]:
        x1, y1, x2, y2 = X(ax), Y(ay), X(bx), Y(by)
        d.rectangle([min(x1, x2) - h, min(y1, y2) - h, max(x1, x2) + h, max(y1, y2) + h], fill=fg)
    if flag:
        top, bot = Y(g0) + h + margin, Y(g1) - h - margin
        if bot > top:
            d.rectangle([X(9) - h, top, X(9) + h, bot], fill=flag)

# ---- favicon.ico, 16 and 32, because feed readers still request /favicon.ico
im = Image.new("RGB", (128, 128), BG)
mark(ImageDraw.Draw(im), 4, 4, 120, ACCENT, BG)
im.resize((64, 64), Image.LANCZOS).save(join_ := OUT + "/favicon.ico", sizes=[(16, 16), (32, 32)])
print("favicon.ico")

# ---- apple-touch-icon, 180x180, full bleed, no transparency, no rounded corners
im = Image.new("RGB", (180, 180), ACCENT)
pair(ImageDraw.Draw(im), 90, 90, 180 * 0.62, 180 * 0.088, BG, gap=4.6)
im.save(OUT + "/apple-touch-icon.png", optimize=True)
print("apple-touch-icon.png")

# ---- logo-512.png, the square logo anything off this site asks for.
# Sized against the worst case rather than the nicest: launch boards draw it at
# 28 to 48 pixels, so the mark takes two thirds of the tile, the stroke is a
# tenth of it, and the hole is wide enough to still be a hole at 36px. Checked at
# that size before shipping, not just at 512.
im = Image.new("RGB", (512, 512), ACCENT)
pair(ImageDraw.Draw(im), 256, 256, 512 * 0.66, 512 * 0.098, BG, gap=5.4, flag=HI, margin=512 * 0.016)
im.save(OUT + "/logo-512.png", optimize=True)
print("logo-512.png")

# ---- og.png, 1200x630. Flat colour and text, quantised, so it stays small.
W, H = 1200, 630
im = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(im)
PAD = 88

mark(d, PAD, PAD - 6, 52, ACCENT, BG)
d.text((PAD + 68, PAD + 8), "margyn.xyz", font=font(SANS, 26), fill=MUT)

d.text((PAD, 208), "Your tests pass.", font=font(BOLD, 76), fill=INK)
d.text((PAD, 296), "That is not the same", font=font(BOLD, 76), fill=INK)
d.text((PAD, 384), "as working.", font=font(BOLD, 76), fill=INK)

d.line([(PAD, 494), (W - PAD, 494)], fill=LINE, width=2)
d.text((PAD, 522), "Every finding ships a reproduction you can run.", font=font(SANS, 30), fill=MUT)
d.text((PAD, 566), "npx margyn-scan /path/to/repo", font=font(MONO, 26), fill=ACCENT)

# Flat colours quantise hard, so 16 colours is lossless here in practice and it
# cuts the file by two thirds against truecolour.
im.convert("P", palette=Image.ADAPTIVE, colors=16).save(OUT + "/og.png", optimize=True)
print("og.png")

# ---- card.png, 1200x630. The product card, for anywhere that shows a listing
# rather than a link. The OG card carries the line; this one carries what the
# tool looks for, because a board full of cards is read for what a thing does.
# Every check named here is a real check in src/checks.
#
# The text is measured and the layout asserts it fits. The first draft of this
# card ran the headline through the checks column, which a generator that only
# prints "card.png" will happily do again.
im = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(im)
d.rectangle([0, 0, 22, H], fill=ACCENT)

def fits(text, ft, limit, where):
    w = d.textlength(text, font=ft)
    if w > limit:
        raise SystemExit("card.png: %r is %dpx wide, %d allowed in %s" % (text, w, limit, where))
    return w

pair(d, PAD + 34, PAD + 30, 68, 6.6, ACCENT, gap=5.4, flag=HI, margin=1.6)
d.text((PAD + 92, PAD - 4), "margyn", font=font(BOLD, 46), fill=INK)
d.text((PAD + 96, PAD + 50), "margyn.xyz", font=font(MONO, 21), fill=MUT)

HEAD = font(BOLD, 62)
for i, line in enumerate(["It audits the tests,", "not the code."]):
    fits(line, HEAD, W - 2 * PAD, "headline")
    d.text((PAD, 214 + i * 74), line, font=HEAD, fill=INK)

# Four checks, two columns. The column break is measured off the widest label in
# the left column rather than guessed.
CHECKS = [
    "tests that assert nothing",
    "source git never committed",
    "gates nothing invokes",
    "code no test can break",
]
SMALL = font(SANS, 24)
col2 = PAD + 34 + int(max(d.textlength(t, font=SMALL) for t in CHECKS[:2])) + 64
for i, line in enumerate(CHECKS):
    x = PAD if i < 2 else col2
    y = 398 + (i % 2) * 42
    fits(line, SMALL, W - PAD - (x + 34), "check column")
    d.rectangle([x, y + 8, x + 10, y + 18], fill=HI)
    d.text((x + 34, y), line, font=SMALL, fill=MUT)

d.line([(PAD, 498), (W - PAD, 498)], fill=LINE, width=2)
d.text((PAD, 524), "Every finding ships one command that reproduces it.", font=font(SANS, 27), fill=MUT)
d.text((PAD, 568), "npx margyn-scan /path/to/repo", font=font(MONO, 27), fill=ACCENT)
im.convert("P", palette=Image.ADAPTIVE, colors=16).save(OUT + "/card.png", optimize=True)
print("card.png")
`;

try {
  const out = execFileSync("python3", ["-c", py], { encoding: "utf8" });
  process.stdout.write(out);
} catch (error) {
  console.error(String(error.stdout ?? "") + String(error.stderr ?? error.message));
  process.exitCode = 1;
}
