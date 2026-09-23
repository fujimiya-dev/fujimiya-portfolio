const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");

const fontPath = path.join(__dirname, "../src/fonts/nothing-you-could-do/NothingYouCouldDo-Regular.ttf");
const text = "Welcome to the Moonlit Dream";
const fontSize = 120;

// opentype.loadSync is deprecated (and broken as of opentype.js 2.0.0 — it
// silently returns undefined instead of throwing), so parse the buffer
// directly per the library's own migration notice.
const buf = fs.readFileSync(fontPath);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// stroke-dasharray/stroke-dashoffset resets at every SVG subpath boundary,
// so one combined multi-glyph path can't be traced as a single continuous
// left-to-right stroke — every glyph (and hollow counters like the hole in
// "o") is its own subpath, and a dash pattern sized to the *combined*
// path's total length leaves each individual (much shorter) subpath fully
// inside the same "on" segment for nearly the whole animation, so the text
// jumps to fully-drawn almost immediately instead of tracing. Exporting one
// path per glyph — each independently length-normalized and staggered in
// the component — avoids that.
const glyphPaths = font.getPaths(text, 0, 0, fontSize);
const combined = font.getPath(text, 0, 0, fontSize);
const bbox = combined.getBoundingBox();

const output = {
  glyphs: glyphPaths.map((p) => p.toPathData(2)).filter((d) => d.length > 0),
  viewBox: `${bbox.x1} ${bbox.y1} ${bbox.x2 - bbox.x1} ${bbox.y2 - bbox.y1}`,
};

const outPath = path.join(__dirname, "../src/components/introPathData.json");
fs.writeFileSync(outPath, JSON.stringify(output));
console.log("Generated:", outPath);
console.log("glyphs:", output.glyphs.length, "viewBox:", output.viewBox);
