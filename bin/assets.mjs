/**
 * Generates the favicon, the touch icon and the OG card.
 *
 * Every image on this site is drawn here from the palette in bin/contrast.mjs.
 * Nothing is downloaded and nothing is a screenshot with text pasted on, so
 * there is no image licence to defend and no stale asset to explain.
 *
 * Run `npm run assets`. The SVG is written directly; the rasters need PIL, so
 * this shells out to python3 and says so if it is missing rather than shipping a
 * page that references a file that is not there.
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
 */
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${LIGHT.accent}"/>
  <path d="M12.5 8.5 H9 V15" stroke="${LIGHT.bg}" stroke-width="2.6" fill="none" stroke-linecap="square"/>
  <path d="M9 19.5 V23.5 H12.5" stroke="${LIGHT.bg}" stroke-width="2.6" fill="none" stroke-linecap="square"/>
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
BG, INK, MUT, ACCENT, CARD, LINE = ${JSON.stringify([LIGHT.bg, LIGHT.ink, LIGHT.mut, LIGHT.accent, LIGHT.card, LIGHT.line])}

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
    seg([(12.5, 8.5), (9, 8.5), (9, 15)])
    seg([(9, 19.5), (9, 23.5), (12.5, 23.5)])
    seg([(19.5, 8.5), (23, 8.5), (23, 23.5), (19.5, 23.5)])

# ---- favicon.ico, 16 and 32, because feed readers still request /favicon.ico
im = Image.new("RGB", (128, 128), BG)
mark(ImageDraw.Draw(im), 4, 4, 120, ACCENT, BG)
im.resize((64, 64), Image.LANCZOS).save(join_ := OUT + "/favicon.ico", sizes=[(16, 16), (32, 32)])
print("favicon.ico")

# ---- apple-touch-icon, 180x180, full bleed, no transparency, no rounded corners
im = Image.new("RGB", (180, 180), ACCENT)
d = ImageDraw.Draw(im)
u = 180 / 32.0
w = max(3, int(180 * 0.075))
def seg(pts):
    d.line([(a * u, b * u) for a, b in pts], fill=BG, width=w, joint="curve")
seg([(12.5, 8.5), (9, 8.5), (9, 15)])
seg([(9, 19.5), (9, 23.5), (12.5, 23.5)])
seg([(19.5, 8.5), (23, 8.5), (23, 23.5), (19.5, 23.5)])
im.save(OUT + "/apple-touch-icon.png", optimize=True)
print("apple-touch-icon.png")

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
d.text((PAD, 566), "npx margyn /path/to/repo", font=font(MONO, 26), fill=ACCENT)

# Flat colours quantise hard, so 16 colours is lossless here in practice and it
# cuts the file by two thirds against truecolour.
im.convert("P", palette=Image.ADAPTIVE, colors=16).save(OUT + "/og.png", optimize=True)
print("og.png")
`;

try {
  const out = execFileSync("python3", ["-c", py], { encoding: "utf8" });
  process.stdout.write(out);
} catch (error) {
  console.error(String(error.stdout ?? "") + String(error.stderr ?? error.message));
  process.exitCode = 1;
}
