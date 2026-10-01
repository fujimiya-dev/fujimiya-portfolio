const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");

const text = "A Moonlit Dream";
const fontSize = 120;

// The font (Cappuccino Letter, free version) may not be uploaded to a
// server per its license, so it's never committed — it only ever exists
// locally in the gitignored scripts/fonts/ folder, dropped in by hand. The
// filename isn't hardcoded since it's whatever the distributed file is
// named; we just look for the first .otf/.ttf in that folder.
const fontsDir = path.join(__dirname, "fonts");
const FONT_EXTENSIONS = [".otf", ".ttf"];

if (!fs.existsSync(fontsDir)) {
  throw new Error(
    `scripts/fonts/ not found. Create it and place the Cappuccino Letter .otf/.ttf file inside before running this script.`
  );
}

const fontFile = fs
  .readdirSync(fontsDir)
  .find((name) => FONT_EXTENSIONS.includes(path.extname(name).toLowerCase()));

if (!fontFile) {
  throw new Error(
    `No .otf/.ttf font file found in scripts/fonts/. Place the Cappuccino Letter font file there before running this script.`
  );
}

const fontPath = path.join(fontsDir, fontFile);
console.log("Using font:", fontFile);

// opentype.loadSync is deprecated (and broken as of opentype.js 2.0.0 — it
// silently returns undefined instead of throwing), so parse the buffer
// directly per the library's own migration notice.
const buf = fs.readFileSync(fontPath);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// This particular (free/demo) font's GPOS/kerning tables are corrupted for
// some glyph-sequence lookups — font.getPath(text, ...) silently emits
// literal "NaN" coordinates inside the "t" and "D" glyph outlines when
// drawing this exact string (verified: reproducible down to one specific
// cumulative x offset, e.g. 432.96000000000004 — one ULP away from a value
// that renders fine). Positioning glyphs manually one at a time (plain
// advance-width accumulation, no kerning/GPOS lookups at all) sidesteps the
// buggy code path entirely. Rounding the running x offset before each
// glyph also matters on its own — the NaN only appears at one exact
// unrounded floating-point value, so even this manual loop still has to
// dodge it.
const fontScale = fontSize / font.unitsPerEm;
let x = 0;
const glyphPathStrings = [];
let bbox = null;

for (const ch of text) {
  const glyph = font.charToGlyph(ch);
  const roundedX = Math.round(x * 1000) / 1000;
  const glyphPath = glyph.getPath(roundedX, 0, fontSize);
  const d = glyphPath.toPathData(2);
  if (d.length > 0) {
    glyphPathStrings.push(d);
    const b = glyphPath.getBoundingBox();
    bbox = bbox
      ? {
          x1: Math.min(bbox.x1, b.x1),
          y1: Math.min(bbox.y1, b.y1),
          x2: Math.max(bbox.x2, b.x2),
          y2: Math.max(bbox.y2, b.y2),
        }
      : b;
  }
  x += glyph.advanceWidth * fontScale;
}

const combinedPath = glyphPathStrings.join(" ");
if (combinedPath.includes("NaN")) {
  throw new Error("Generated path still contains NaN — the positioning workaround did not fully avoid the bug.");
}

const output = {
  path: combinedPath,
  viewBox: `${bbox.x1} ${bbox.y1} ${bbox.x2 - bbox.x1} ${bbox.y2 - bbox.y1}`,
};

const outPath = path.join(__dirname, "../src/components/heroTitlePathData.json");
fs.writeFileSync(outPath, JSON.stringify(output));
console.log("Generated:", outPath);
console.log("viewBox:", output.viewBox);
