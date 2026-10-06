import type { Locale } from "./types";

// Prefixes a route ("/works", "/#about") with "/en" for the English site —
// Japanese stays unprefixed (the existing, already-indexed URLs). Used
// anywhere a server component builds an href/Link target from a known
// locale, as opposed to LanguageToggle's client-side equivalent which
// instead derives the target from the current pathname.
export function withLocale(href: string, locale: Locale): string {
  if (locale === "ja") return href;
  if (href === "/") return "/en";
  if (href.startsWith("/#")) return `/en${href.slice(1)}`;
  return `/en${href}`;
}
