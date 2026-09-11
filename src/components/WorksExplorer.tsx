"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTagFilter } from "@/lib/useTagFilter";
import { RevealFade } from "@/components/RevealSection";

type Work = {
  id: string;
  slug: string;
  numberLabel: string;
  title: string;
  dateLabel: string;
  award: string | null;
  summary: string;
  description: string;
  demoUrl: string | null;
  imageUrl: string | null;
  tags: string[];
};

export default function WorksExplorer({ works }: { works: Work[] }) {
  const { query, setQuery, activeTag, toggleTag, allTags, filtered } =
    useTagFilter(works, (w) => `${w.title} ${w.description} ${w.tags.join(" ")}`);

  return (
    <div>
      <div className="search-sticky glass-panel mb-8 rounded-sm p-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="使用技術やキーワードで検索（例：Python、Unity、ハッカソン）"
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
          <p className="mt-4 text-sm text-ink-faint">該当する制作物が見つかりませんでした。</p>
        )}
      </div>

      <div className="space-y-7">
        {filtered.map((work) => (
          <RevealFade key={work.id}>
            <article className="glass-panel grid grid-cols-1 gap-8 rounded-sm p-7 md:grid-cols-2">
              <div className="border border-white/15 bg-white/[0.02] p-2">
                {work.imageUrl ? (
                  <Image
                    src={work.imageUrl}
                    alt={work.title}
                    width={800}
                    height={500}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-xs text-ink-faint">
                    画像未設定
                  </div>
                )}
              </div>
              <div>
                <span className="mb-1 block font-serif text-sm text-accent-moon">
                  {work.numberLabel}
                </span>
                <h3 className="font-serif text-2xl font-bold">{work.title}</h3>
                <span className="mb-4 block text-xs text-ink-faint">
                  {work.dateLabel}
                  {work.award ? `　${work.award}` : ""}
                </span>
                <p className="mb-4 text-sm text-ink-soft">{work.description}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {work.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {work.demoUrl && (
                  <a
                    href={work.demoUrl}
                    target="_blank"
                    rel="noopener"
                    className="border-b border-accent-blue/50 text-sm text-accent-blue transition-colors hover:border-accent-teal hover:text-accent-teal"
                  >
                    デモ動画を見る ↗
                  </a>
                )}
              </div>
            </article>
          </RevealFade>
        ))}
      </div>
    </div>
  );
}
