"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RevealFade } from "@/components/RevealSection";
import { translateTag } from "@/lib/tagLabels";
import { withLocale } from "@/i18n/path";
import type { Locale, Dictionary } from "@/i18n/types";

type Experience = {
  id: string;
  org: string;
  dateLabel: string;
  summary: string;
  tags: string[];
  works: { slug: string; title: string }[];
};

// Always Japanese — see the matching comment in WorksExplorer.tsx.
const CATEGORY_FILTERS = ["個人開発", "チーム開発", "ハッカソン", "インターン"];

// Toggles the search bar + category filter chips on/off without deleting any
// of the code behind them — same approach as SHOW_WORKS_SEARCH_AND_FILTER in
// WorksExplorer.tsx. Conditional *rendering* (not CSS) so a hidden search
// input/filter button can never pick up keyboard focus. When this is false,
// `filtered` is forced to equal `items` unconditionally (see its useMemo
// below) rather than relying on `chips` merely happening to stay empty.
const SHOW_EXPERIENCE_SEARCH_AND_FILTER = false;

export default function ExperienceExplorer({
  items,
  locale,
  dict,
}: {
  items: Experience[];
  locale: Locale;
  dict: Dictionary["experience"];
}) {
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
    if (!SHOW_EXPERIENCE_SEARCH_AND_FILTER || chips.length === 0) return items;
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
      {SHOW_EXPERIENCE_SEARCH_AND_FILTER && (
      <div className="glass-panel mb-8 rounded-sm p-5">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/20 pb-3 focus-within:border-accent-teal">
            {chips.map((chip) => (
              <span
                key={chip}
                className="neon-tag flex items-center gap-1.5 rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
              >
                {translateTag(chip, locale)}
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  aria-label={locale === "ja" ? `${chip}を削除` : `Remove ${translateTag(chip, locale)}`}
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
              placeholder={chips.length === 0 ? dict.searchPlaceholder : ""}
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

        <p className="mb-3 mt-5 text-xs tracking-widest text-ink-faint">{dict.filterByCategory}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleCategoryChip(tag)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                chips.includes(tag)
                  ? "border-accent-teal bg-accent-teal/10 text-[#eaf6ff] shadow-[0_0_10px_rgba(30,64,255,0.35)] [text-shadow:0_0_8px_rgba(127,183,255,0.7)]"
                  : "border-white/20 text-ink-soft hover:border-accent-teal"
              }`}
            >
              {translateTag(tag, locale)}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-4 text-sm text-ink-faint">{dict.empty}</p>
        )}
      </div>
      )}

      <div className="relative space-y-6">
        {filtered.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === filtered.length - 1;
          // The timeline line used to be one plain CSS pseudo-element,
          // spanning the whole list, rendered as soon as this component
          // mounted — regardless of whether any card had scrolled into
          // view yet. Each card, meanwhile, only fades/slides in via its
          // own independent RevealFade reveal. That mismatch is exactly
          // what caused the reported bug (line visible before any card,
          // and visibly drifting from each card mid-transition).
          //
          // Fix: give each card its own line segment, rendered *inside*
          // that same card's RevealFade wrapper (as a sibling to its
          // glass-panel), so it shares the exact same opacity/slide
          // animation and trigger as its card — not merely timed to look
          // similar, but structurally the same transform, so it cannot
          // drift from it at any point. Segments overlap by half the
          // list's gap (space-y-6 = 24px, so 12px) on each side so
          // adjacent segments meet exactly in the gap's midpoint, reading
          // as one continuous line once revealed. The original single
          // gradient's ~12%/88% fade (computed against the full list's
          // height) is approximated here as a fade confined to just the
          // first/last segment's own height — visually indistinguishable
          // in practice, since that original fade zone was already close
          // to one card's height for this list's length.
          const lineClass = isFirst
            ? "bg-[linear-gradient(to_bottom,transparent,rgba(127,183,255,0.4)_90%)]"
            : isLast
              ? "bg-[linear-gradient(to_top,transparent,rgba(127,183,255,0.4)_90%)]"
              : "bg-[rgba(127,183,255,0.4)]";
          return (
          <RevealFade key={item.id} className="relative isolate">
            <div
              aria-hidden
              className={`pointer-events-none absolute left-[97px] -z-10 w-px ${isFirst ? "top-1" : "-top-3"} ${isLast ? "bottom-1" : "-bottom-3"} ${lineClass}`}
            />
            <div className="glass-panel grid grid-cols-[98px_1fr] gap-8 rounded-sm p-5">
              <div className="pt-1 font-serif text-sm text-ink-faint">{item.dateLabel}</div>
              <div>
                <h3 className="mb-1 font-label text-base">{item.org}</h3>
                <p className="mb-3 whitespace-pre-line text-sm text-ink-soft">{item.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="neon-tag rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                    >
                      {translateTag(tag, locale)}
                    </span>
                  ))}
                </div>
                {item.works.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.works.map((work) => (
                      <Link
                        key={work.slug}
                        href={withLocale(`/works/${work.slug}`, locale)}
                        className="hover-glow-text inline-flex items-center gap-1.5 rounded-sm border border-white/20 px-4 py-1.5 text-xs transition-colors hover:border-accent-teal"
                      >
                        {item.works.length > 1
                          ? locale === "ja"
                            ? `${dict.viewWork}（${work.title}）`
                            : `${dict.viewWork} (${work.title})`
                          : dict.viewWork}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </RevealFade>
          );
        })}
      </div>
    </div>
  );
}
