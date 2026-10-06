"use client";

import { useRef, useTransition } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/types";

// Maps the current pathname to its equivalent under the other locale.
// Locale is a URL prefix now ("/en/...", JA unprefixed), not a cookie, so
// switching has to navigate rather than just re-render in place.
function localizedPath(pathname: string, locale: Locale): string {
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  if (locale === "en") {
    if (isEn) return pathname;
    return pathname === "/" ? "/en" : `/en${pathname}`;
  }
  if (!isEn) return pathname;
  return pathname === "/en" ? "/" : pathname.slice(3);
}

// Same text treatment as HorizonNav's page items, so JA/EN reads as part
// of the same row rather than a visually distinct control bolted on.
const ACTIVE_TEXT = "text-[#eaf6ff] [text-shadow:0_0_12px_rgba(127,183,255,0.65)]";
const INACTIVE_TEXT = "text-[#93a3c2] hover:text-[#eaf6ff]";

export default function LanguageToggle({
  current,
  showGlowDot = false,
}: {
  current: Locale;
  // Renders the same sliding-glow dot HorizonNav's page items use under
  // the active language. Only meaningful where there's an actual horizon
  // line for it to sit on (the desktop bar) — the mobile menu has no such
  // line, so it keeps the plain active/inactive text treatment only.
  showGlowDot?: boolean;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Same class of bug HorizonNav.tsx's nav-horizon-glow had (see that file
  // for the full writeup): an actual Next.js route transition can corrupt
  // framer-motion's layoutId position measurement for one frame — even for
  // an element that stays mounted throughout, as JA/EN's own dot does,
  // since its active language doesn't change when navigating between pages
  // in the same locale — making the dot briefly fly to a wrong position
  // before snapping back. Skip the FLIP (hard-cut instead) on the render
  // right after pathname changes, i.e. whenever a route transition just
  // happened, regardless of whether the active language itself changed.
  const prevPathnameRef = useRef(pathname);
  const skipFlipRef = useRef(false);
  if (prevPathnameRef.current !== pathname) {
    skipFlipRef.current = true;
    prevPathnameRef.current = pathname;
  } else {
    skipFlipRef.current = false;
  }

  function choose(locale: Locale) {
    if (locale === current) return;
    const target = localizedPath(pathname, locale);
    // A plain client-side router.push() leaves the root layout (TopNav,
    // Footer, <html lang>) stale: "/en" isn't a real route segment to
    // Next's client router (only middleware.ts rewrites it), so crossing
    // the locale boundary doesn't look like a layout change and the
    // already-rendered layout output is reused as-is. A full navigation
    // forces middleware to run again and the whole tree — including the
    // layout — to re-render server-side with the new locale.
    startTransition(() => {
      window.location.href = target;
    });
  }

  return (
    <div className="relative flex items-center gap-1.5" aria-busy={isPending}>
      {(["ja", "en"] as const).map((locale, i) => {
        const active = current === locale;
        return (
          <div key={locale} className="relative flex items-center">
            {i === 1 && <span className="mr-1.5 text-[15px] text-[#93a3c2]">/</span>}
            <button
              onClick={() => choose(locale)}
              className={`relative text-[15px] transition-colors ${active ? ACTIVE_TEXT : INACTIVE_TEXT}`}
              aria-current={active}
            >
              {locale.toUpperCase()}
            </button>
            {/* Same glow recipe as HorizonNav's page-item dot, but its own
                layoutId group — JA/EN's active state is independent of
                (and visible at the same time as) whichever page item is
                active, so it can't share that group's single instance. */}
            {showGlowDot && active && (
              <motion.div
                layoutId={skipFlipRef.current ? undefined : "lang-horizon-glow"}
                initial={false}
                className="pointer-events-none absolute -bottom-4 left-0 right-0 h-[4px] rounded-full"
                style={{ background: "#eaf6ff", boxShadow: "0 0 7px 1px #7FB7FF, 0 0 19px 4px #1E40FF" }}
                transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
