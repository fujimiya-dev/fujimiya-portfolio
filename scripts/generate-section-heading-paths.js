const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");

// The section <h2> headings, keyed to match src/i18n's nav labels
// (identical text in both ja/en dictionaries, so one path per heading
// covers both locales) plus the admin-only login/management titles
// (English-only, no i18n key — the admin UI isn't localized).
const HEADINGS = {
  aboutMe: "About me",
  works: "Works",
  experience: "Experience",
  research: "Research",
  other: "Other",
  contact: "Contact",
  login: "Login",
  privacyPolicy: "Privacy Policy",
  admin: "Admin",
  worksAdmin: "Works Admin",
  experienceAdmin: "Experience Admin",
  researchAdmin: "Research Admin",
};
const fontSize = 120;

// Licensed "Cappuccino Letter" font — must never be embedded via @font-face
// (extractable from the browser) or committed to the repo. It only exists
// locally in the gitignored scripts/fonts/ folder; this script extracts
// static vector outlines at build time, same approach as the Hero title
// (generate-hero-title-path.js) and the intro animation. Multiple weights
// live in that folder side by side (Normal_Regular, Normal_Bold,
// Rough_Bold), so — unlike the Hero/intro scripts — the filename is matched
// explicitly here rather than picking "the first .otf/.ttf found".
const fontsDir = path.join(__dirname, "fonts");
const FONT_FILENAME_MATCH = /normal_bold/i;

if (!fs.existsSync(fontsDir)) {
  throw new Error(`scripts/fonts/ not found. Place the Cappuccino Letter Normal_Bold .otf file inside before running this script.`);
}

const fontFile = fs.readdirSync(fontsDir).find((name) => FONT_FILENAME_MATCH.test(name));
if (!fontFile) {
  throw new Error(`No file matching "Normal_Bold" found in scripts/fonts/. Place CappuccinoLetter-Normal_Bold.otf there before running this script.`);
}

const fontPath = path.join(fontsDir, fontFile);
console.log("Using font:", fontFile);

// opentype.loadSync is deprecated (and broken as of opentype.js 2.0.0 — it
// silently returns undefined instead of throwing), so parse the buffer
// directly per the library's own migration notice.
const buf = fs.readFileSync(fontPath);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// Same NaN-avoidance workaround as generate-hero-title-path.js: this font's
// GPOS/kerning tables emit literal "NaN" coordinates inside specific glyphs
// when drawn via font.getPath(text, ...)'s string API for certain glyph
// sequences. Positioning each glyph manually (plain advance-width
// accumulation, rounded running x offset) sidesteps the buggy code path
// entirely rather than hoping this text/font combination doesn't hit it.
function extractPath(text) {
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
        ? { x1: Math.min(bbox.x1, b.x1), y1: Math.min(bbox.y1, b.y1), x2: Math.max(bbox.x2, b.x2), y2: Math.max(bbox.y2, b.y2) }
        : b;
    }
    x += glyph.advanceWidth * fontScale;
  }

  const combinedPath = glyphPathStrings.join(" ");
  if (combinedPath.includes("NaN")) {
    throw new Error(`Generated path for ${JSON.stringify(text)} still contains NaN.`);
  }
  return {
    path: combinedPath,
    viewBox: `${bbox.x1} ${bbox.y1} ${bbox.x2 - bbox.x1} ${bbox.y2 - bbox.y1}`,
  };
}

const output = {};
for (const [key, text] of Object.entries(HEADINGS)) {
  output[key] = extractPath(text);
  console.log(key, "->", JSON.stringify(text), "viewBox:", output[key].viewBox);
}

const outPath = path.join(__dirname, "../src/components/sectionHeadingPathData.json");
fs.writeFileSync(outPath, JSON.stringify(output));
console.log("Generated:", outPath);
