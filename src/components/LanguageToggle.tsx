"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { setLocale } from "@/actions/locale";
import type { Locale } from "@/i18n/types";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
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
                layoutId="lang-horizon-glow"
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
