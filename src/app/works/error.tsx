"use client";

import { useEffect } from "react";

// Catches any uncaught render-time error for /works and /works/[slug] (both
// are descendants of this segment) — e.g. a DB query that still failed
// after fetchWorkBySlug's retries — and shows a page that keeps the site's
// own layout (nav, background) instead of Next.js's bare default error UI,
// with a way to retry without a full reload.
export default function WorksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[works] render error:", error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-24 pt-32 text-center">
      <p className="text-sm text-ink-soft">
        読み込みに失敗しました。しばらくしてから再読み込みしてください。
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
      >
        再読み込み
      </button>
    </section>
  );
}
