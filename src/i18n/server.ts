import { headers } from "next/headers";
import { DEFAULT_LOCALE, type Locale, type Dictionary } from "./types";
import { ja } from "./ja";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { ja, en };

// The URL path is now the source of truth for locale (middleware.ts sets
// this header based on the "/en" prefix). Falls back to the default locale
// if the header is somehow missing (e.g. a context middleware didn't run
// against, such as a route handler invoked outside the normal request
// path) rather than erroring.
export async function getLocale(): Promise<Locale> {
  const store = await headers();
  const value = store.get("x-locale");
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
