"use client";

import { useState, type ReactNode } from "react";

// Both the JA and EN field groups stay mounted at all times (just hidden
// via CSS) so the single surrounding <form> still submits every field
// regardless of which tab is showing — this only toggles visibility, not
// which inputs exist in the DOM.
export default function LocaleTabs({ ja, en }: { ja: ReactNode; en: ReactNode }) {
  const [tab, setTab] = useState<"ja" | "en">("ja");

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-white/10">
        {(["ja", "en"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t
                ? "border-b-2 border-accent-teal text-accent-teal"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {t === "ja" ? "日本語" : "English"}
          </button>
        ))}
      </div>
      <div className={tab === "ja" ? "space-y-5" : "hidden space-y-5"}>{ja}</div>
      <div className={tab === "en" ? "space-y-5" : "hidden space-y-5"}>{en}</div>
    </div>
  );
}
