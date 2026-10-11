// Single source of truth for the header logo's text — also read directly by
// scripts/build-fonts.py (via scripts/get-logo-text.mjs) to regenerate the
// Nothing You Could Do font's subset whenever this string changes, so the
// logo's own webfont never needs to cover more than what it actually spells
// out.
export const SITE_LOGO_TEXT = "Fujimiya.dev";
