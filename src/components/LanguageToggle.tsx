"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/actions/locale";
import type { Locale } from "@/i18n/types";

export default function LanguageToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  // Same neon palette as the horizon nav's active-item glow: core #eaf6ff,
  // halo #7FB7FF / #1E40FF.
  const activeClass = "text-[#eaf6ff] [text-shadow:0_0_4px_#eaf6ff,0_0_10px_#7FB7FF,0_0_18px_#1E40FF]";

  return (
    <div className="flex items-center gap-1 text-sm" aria-busy={isPending}>
      <button
        onClick={() => choose("ja")}
        className={`px-2 py-1 transition-all duration-300 ${current === "ja" ? activeClass : "text-ink-faint hover:text-ink"}`}
        aria-current={current === "ja"}
      >
        JA
      </button>
      <span className="text-ink-faint">/</span>
      <button
        onClick={() => choose("en")}
        className={`px-2 py-1 transition-all duration-300 ${current === "en" ? activeClass : "text-ink-faint hover:text-ink"}`}
        aria-current={current === "en"}
      >
        EN
      </button>
    </div>
  );
}
