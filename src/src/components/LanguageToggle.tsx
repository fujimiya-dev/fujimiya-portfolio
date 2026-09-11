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

  return (
    <div className="flex items-center gap-1 text-xs" aria-busy={isPending}>
      <button
        onClick={() => choose("ja")}
        className={`px-2 py-1 transition-colors ${
          current === "ja" ? "text-accent-teal" : "text-ink-faint hover:text-ink"
        }`}
        aria-current={current === "ja"}
      >
        JA
      </button>
      <span className="text-ink-faint">/</span>
      <button
        onClick={() => choose("en")}
        className={`px-2 py-1 transition-colors ${
          current === "en" ? "text-accent-teal" : "text-ink-faint hover:text-ink"
        }`}
        aria-current={current === "en"}
      >
        EN
      </button>
    </div>
  );
}
