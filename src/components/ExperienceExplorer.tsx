"use client";

import { useMemo, useState } from "react";
import { RevealFade } from "@/components/RevealSection";

type Experience = {
  id: string;
  org: string;
  dateLabel: string;
  summary: string;
  tags: string[];
};

const CATEGORY_FILTERS = [
  "個人開発",
  "チーム開発",
  "ハッカソン",
  "インターン",
  "ビジネス",
  "史学",
  "教育",
  "地域活動",
];

export default function ExperienceExplorer({ items }: { items: Experience[] }) {
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => item.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [items]);

  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [];
    return allTags
      .filter((tag) => !chips.includes(tag) && tag.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allTags, chips, inputValue]);

  const filtered = useMemo(() => {
    if (chips.length === 0) return items;
    return items.filter((item) => {
      const text = `${item.org} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
      return chips.every((chip) => text.includes(chip.toLowerCase()));
    });
  }, [items, chips]);

  function addChip(tag: string) {
    const t = tag.trim();
    if (!t) return;
    setChips((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setInputValue("");
    setShowSuggestions(false);
  }

  function removeChip(tag: string) {
    setChips((prev) => prev.filter((t) => t !== tag));
  }

  function toggleCategoryChip(tag: string) {
    setChips((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(inputValue);
    }
  }

  return (
    <div>
      <div className="glass-panel mb-8 rounded-sm p-5">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/20 pb-3 focus-within:border-accent-teal">
            {chips.map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-1.5 rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  aria-label={`${chip}を削除`}
                  className="text-accent-teal/70 hover:text-accent-teal"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="search"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={onInputKeyDown}
              placeholder={chips.length === 0 ? "キーワードや使用技術で検索（例：ハッカソン、インターン、Python）" : ""}
              className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-sm border border-white/10 bg-sky-deep/95 text-sm shadow-lg backdrop-blur-md">
              {suggestions.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addChip(tag);
                    }}
                    className="block w-full px-4 py-2 text-left text-ink-soft transition-colors hover:bg-white/5 hover:text-accent-teal"
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mb-3 mt-5 text-xs tracking-widest text-ink-faint">カテゴリー別に絞り込み</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleCategoryChip(tag)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                chips.includes(tag)
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
                <h3 className="mb-1 font-label text-base">{item.org}</h3>
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
