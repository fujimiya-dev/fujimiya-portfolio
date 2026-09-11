"use client";

import Image from "next/image";
import { useTagFilter } from "@/lib/useTagFilter";
import { RevealFade } from "@/components/RevealSection";

type ResearchItem = {
  id: string;
  stage: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  caption: string | null;
  tags: string[];
};

export default function ResearchExplorer({ items }: { items: ResearchItem[] }) {
  const { query, setQuery, activeTag, toggleTag, allTags, filtered } = useTagFilter(
    items,
    (r) => `${r.title} ${r.summary} ${r.tags.join(" ")}`,
    (r) => r.tags
  );

  return (
    <div>
      <div className="search-sticky glass-panel mb-8 rounded-sm p-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワードで検索（例：ポロック、AR、視線）"
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
          <p className="mt-4 text-sm text-ink-faint">該当する研究が見つかりませんでした。</p>
        )}
      </div>

      <div className="space-y-14">
        {filtered.map((item) => (
          <RevealFade key={item.id}>
            <div className="glass-panel grid grid-cols-1 gap-10 rounded-sm p-7 md:grid-cols-[280px_1fr]">
              <figure className="border border-white/15 bg-white/[0.02] p-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={600}
                    height={400}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-xs text-ink-faint">
                    画像未設定
                  </div>
                )}
                {item.caption && (
                  <figcaption className="mt-2 text-center text-xs text-ink-faint">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
              <div>
                <span className="mb-2 block text-xs tracking-wide text-accent-moon">{item.stage}</span>
                <h3 className="mb-4 font-serif text-xl font-bold leading-relaxed">{item.title}</h3>
                <p className="text-sm text-ink-soft">{item.summary}</p>
              </div>
            </div>
          </RevealFade>
        ))}
      </div>
    </div>
  );
}
