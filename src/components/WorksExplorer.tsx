"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RevealFade } from "@/components/RevealSection";
import NoImage from "@/components/NoImage";
import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import { withLocale } from "@/i18n/path";
import { translateTag } from "@/lib/tagLabels";
import type { Locale, Dictionary } from "@/i18n/types";

type Work = {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  award: string | null;
  summary: string;
  description: string;
  youtubeId: string | null;
  imageUrl: string | null;
  category: string[];
  techStack: string[];
};

// Always Japanese — these are the values actually stored on each Work and
// matched against for filtering; translateTag() only changes how a value is
// *displayed*, never which works match a given filter/search chip.
const CATEGORY_FILTERS = ["公開作品", "個人開発", "チーム開発", "ハッカソン", "インターン"];

// Toggles the search bar + category filter chips on/off without deleting
// any of the code behind them, so this is a one-line flip to bring them
// back later. Conditional *rendering* (not a CSS class) specifically so a
// hidden search input/filter button can never pick up keyboard focus —
// display:none still leaves an element focusable by Tab in some browsers,
// not-rendering it at all doesn't. When this is false, `filtered` is
// forced to equal `works` unconditionally (see its useMemo below) rather
// than relying on `chips` merely happening to stay empty with no UI left
// to populate it — so every work always shows, with no dependence on
// nothing else ever setting `chips`.
const SHOW_WORKS_SEARCH_AND_FILTER = false;

export default function WorksExplorer({
  works,
  locale,
  dict,
}: {
  works: Work[];
  locale: Locale;
  dict: Dictionary["works"];
}) {
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    works.forEach((w) => [...w.category, ...w.techStack].forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [works]);

  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [];
    return allTags
      .filter((tag) => !chips.includes(tag) && tag.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allTags, chips, inputValue]);

  const filtered = useMemo(() => {
    if (!SHOW_WORKS_SEARCH_AND_FILTER || chips.length === 0) return works;
    return works.filter((w) => {
      const text = `${w.title} ${w.description} ${w.category.join(" ")} ${w.techStack.join(" ")}`.toLowerCase();
      return chips.every((chip) => text.includes(chip.toLowerCase()));
    });
  }, [works, chips]);

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
      {SHOW_WORKS_SEARCH_AND_FILTER && (
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {filtered.map((work) => (
          <RevealFade key={work.id}>
            <Link href={withLocale(`/works/${work.slug}`, locale)} className="group block h-full">
              <article className="glass-panel flex h-full flex-col overflow-hidden rounded-sm transition-all group-hover:border-accent-teal/70 group-hover:shadow-[0_0_28px_rgba(30,64,255,0.28)]">
                <div className="relative aspect-video border-b border-white/10 bg-white/[0.02]">
                  {work.imageUrl ? (
                    <Image
                      src={work.imageUrl}
                      alt={work.title}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-contain"
                    />
                  ) : work.youtubeId ? (
                    <YouTubeThumbnail videoId={work.youtubeId} alt={work.title} />
                  ) : (
                    <NoImage />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="hover-glow-card-title font-label text-xl font-bold">
                    {work.title}
                  </h3>
                  <span className="mb-3 mt-1 block text-xs text-ink-faint">
                    <span className="block">{work.dateLabel}</span>
                    {work.award && <span className="block whitespace-pre-line">{work.award}</span>}
                  </span>
                  <p className="mb-4 line-clamp-2 whitespace-pre-line text-sm text-ink-soft">{work.summary}</p>
                  <div className="mt-auto space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {work.category.map((tag) => (
                        <span
                          key={tag}
                          className="neon-tag rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                        >
                          {translateTag(tag, locale)}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {work.techStack.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-ink-soft"
                        >
                          {translateTag(tag, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </RevealFade>
        ))}
      </div>
    </div>
  );
}
