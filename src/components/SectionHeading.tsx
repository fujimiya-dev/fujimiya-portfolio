import sectionHeadingPathData from "./sectionHeadingPathData.json";

// Same approach as the Hero title ("A Moonlit Dream"): the purchased
// "Cappuccino Letter" font's license prohibits a form of use a third party
// could extract the font file from (which @font-face/next/font embedding
// allows via devtools) — so instead of loading the font itself, the glyph
// outlines are extracted once at build time (scripts/generate-section-
// heading-paths.js) into static SVG path data, and only that gets shipped.
// The actual .otf never leaves scripts/fonts/ (gitignored).
type HeadingKey = keyof typeof sectionHeadingPathData;

// Exactly the Fujimiya.dev logo's glow (DesktopNavBar.tsx/TopNav.tsx:
// text-shadow:0_0_4px_#eaf6ff,0_0_11px_#7FB7FF,0_0_22px_#1E40FF) — SVG has
// no text-shadow, so the same three layers are reproduced as drop-shadow.
const GLOW_FILTER = "drop-shadow(0 0 4px #eaf6ff) drop-shadow(0 0 11px #7FB7FF) drop-shadow(0 0 22px #1E40FF)";

export default function SectionHeading({ textKey, label, className }: { textKey: HeadingKey; label: string; className?: string }) {
  const data = sectionHeadingPathData[textKey];
  return (
    // The SVG is decorative (aria-hidden) with a visually-hidden real-text
    // fallback, so this still reads as an actual <h2> landmark/heading to
    // screen readers and search engines — a bare aria-label'd <svg> in place
    // of the heading element would lose that document structure entirely.
    <h2>
      <svg
        aria-hidden="true"
        viewBox={data.viewBox}
        className={className ?? "heading-xl mx-auto w-auto"}
        style={{ filter: GLOW_FILTER }}
      >
        <path d={data.path} fill="#eaf6ff" />
      </svg>
      <span className="sr-only">{label}</span>
    </h2>
  );
}
