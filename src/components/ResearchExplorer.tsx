"use client";

import Image from "next/image";
import Link from "next/link";
import { RevealFade } from "@/components/RevealSection";

type ResearchItem = {
  id: string;
  slug: string;
  stage: string;
  title: string;
  summary: string;
  cardSummary: string | null;
  imageUrl: string | null;
  tags: string[];
};

function NoImage() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-ink-faint">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span className="text-[10px] tracking-wide">No Image</span>
    </div>
  );
}

export default function ResearchExplorer({ items }: { items: ResearchItem[] }) {
  return (
    <div className="space-y-14">
      {items.map((item) => (
        <RevealFade key={item.id}>
          <Link href={`/research/${item.slug}`} className="group block">
            <div className="glass-panel grid grid-cols-1 gap-10 rounded-sm p-7 transition-all group-hover:border-accent-teal/50 group-hover:shadow-[0_0_24px_rgba(30,64,255,0.18)] md:grid-cols-[280px_1fr]">
              <figure className="relative aspect-video overflow-hidden rounded-sm border border-white/15 bg-white/[0.02]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(min-width: 768px) 280px, 100vw"
                    className="object-contain"
                  />
                ) : (
                  <NoImage />
                )}
              </figure>
              <div>
                <span className="mb-2 block text-xs tracking-wide text-accent-blue">{item.stage}</span>
                <h3 className="mb-4 font-label text-xl font-bold leading-relaxed transition-colors group-hover:text-accent-teal">
                  {item.title}
                </h3>
                <p className="mb-4 whitespace-pre-line text-sm text-ink-soft">{item.cardSummary || item.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="neon-tag rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </RevealFade>
      ))}
    </div>
  );
}
