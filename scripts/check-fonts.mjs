// Read-only check: does every character currently used in the live database
// content and the static UI text fall inside the font subset actually
// shipped (scripts/font-charsets/covered-chars.txt, written by
// `npm run fonts:build`)? Never writes to the database. Prints only the
// list of MISSING characters — never the DB content itself — so it's safe
// to run and share output from at any time, including right after an admin
// edit in production.
//
// Run with: npm run fonts:check
//
// If this reports missing characters: re-generate
// scripts/font-charsets/db-snapshot.txt from the current DB content, then
// run `npm run fonts:build` to fold them into the shipped subset.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

function collectChars(value, set) {
  if (value == null) return;
  if (typeof value === "string") {
    for (const ch of value) set.add(ch);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectChars(v, set));
  } else if (typeof value === "object") {
    Object.values(value).forEach((v) => collectChars(v, set));
  }
}

async function main() {
  const covered = new Set(
    readFileSync(join(__dirname, "font-charsets", "covered-chars.txt"), "utf8")
  );
  if (covered.size === 0) {
    console.error(
      "scripts/font-charsets/covered-chars.txt is empty or missing — run `npm run fonts:build` at least once first."
    );
    process.exitCode = 1;
    return;
  }

  const used = new Set();

  // Read-only queries only — no create/update/delete anywhere in this file.
  const [works, experiences, research] = await Promise.all([
    prisma.work.findMany({ include: { translations: true } }),
    prisma.experience.findMany({ include: { translations: true } }),
    prisma.researchItem.findMany({ include: { translations: true } }),
  ]);
  collectChars(works, used);
  collectChars(experiences, used);
  collectChars(research, used);

  for (const f of ["src/i18n/ja.ts", "src/i18n/en.ts"]) {
    const text = readFileSync(join(__dirname, "..", f), "utf8");
    for (const ch of text) used.add(ch);
  }

  const missing = [...used].filter((ch) => !covered.has(ch)).sort();

  console.log(`Checked ${used.size} unique characters (DB content + static UI text) against ${covered.size} covered by the current font subset.`);
  if (missing.length === 0) {
    console.log("OK — no missing characters. Every character currently in use is covered by the shipped font subset.");
  } else {
    console.log(`\n${missing.length} character(s) NOT covered by the current font subset:`);
    console.log(missing.join(" "));
    console.log(
      "\nTo fix: regenerate scripts/font-charsets/db-snapshot.txt from current DB content, then run `npm run fonts:build`."
    );
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
