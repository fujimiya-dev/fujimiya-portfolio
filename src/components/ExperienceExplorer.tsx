"use client";

import { useTagFilter } from "@/lib/useTagFilter";
import { RevealFade } from "@/components/RevealSection";

type Experience = {
  id: string;
  org: string;
  dateLabel: string;
  summary: string;
  tags: string[];
};

export default function ExperienceExplorer({ items }: { items: Experience[] }) {
  const { query, setQuery, activeTag, toggleTag, allTags, filtered } = useTagFilter(
    items,
    (e) => `${e.org} ${e.summary} ${e.tags.join(" ")}`,
    (e) => e.tags
  );

  return (
    <div>
      <div className="search-sticky glass-panel mb-8 rounded-sm p-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="団体名やキーワードで検索（例：Waffle、ハッカソン、講師）"
          className="w-full border-b border-white/20 bg-transparent pb-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent-teal"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                activeTag === tag
                  ? "border-accent-teal bg-accent-teal text-sky-deep"
                  : "border-white/20 text-ink-soft hover:border-accent-teal"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-4 text-sm text-ink-faint">該当する経験が見つかりませんでした。</p>
        )}
      </div>

      <div className="relative space-y-6 before:absolute before:bottom-1 before:left-[97px] before:top-1 before:w-px before:bg-white/10">
        {filtered.map((item) => (
          <RevealFade key={item.id}>
            <div className="glass-panel grid grid-cols-[98px_1fr] gap-8 rounded-sm p-5">
              <div className="pt-1 font-serif text-sm text-ink-faint">{item.dateLabel}</div>
              <div>
                <h3 className="mb-1 font-serif text-base">{item.org}</h3>
                <p className="mb-3 text-sm text-ink-soft">{item.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </RevealFade>
        ))}
      </div>
    </div>
  );
}
