// Prints src/lib/siteBranding.ts's SITE_LOGO_TEXT value to stdout (no
// trailing newline) — called by scripts/build-fonts.py so the logo font's
// subset always matches whatever that constant currently says, without
// needing a TS toolchain inside the Python script.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "..", "src", "lib", "siteBranding.ts"), "utf8");

const match = source.match(/export const SITE_LOGO_TEXT = "((?:[^"\\]|\\.)*)";/);
if (!match) {
  console.error("get-logo-text.mjs: could not find SITE_LOGO_TEXT in src/lib/siteBranding.ts");
  process.exit(1);
}

process.stdout.write(JSON.parse(`"${match[1]}"`));
