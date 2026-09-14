import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RevealFade } from "@/components/RevealSection";

export const revalidate = 0;

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await prisma.work.findUnique({ where: { slug } });
  if (!work) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-28">
      <Link href="/works" className="mb-10 inline-block text-sm text-accent-blue hover:text-accent-teal">
        ← Works 一覧に戻る
      </Link>

      <RevealFade>
        <h1 className="mb-2 font-serif text-4xl font-bold">{work.title}</h1>
        <span className="mb-8 block text-xs text-ink-faint">{work.dateLabel}</span>

        <div className="glass-panel relative mb-8 aspect-video border border-white/15 bg-white/[0.02]">
          {work.imageUrl ? (
            <Image
              src={work.imageUrl}
              alt={work.title}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-contain px-8 py-2"
            />
          ) : (
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
          )}
        </div>

        <div className="mb-8 space-y-4">
          <div className="glass-panel rounded-sm p-6">
            <h2 className="mb-3 font-serif text-sm tracking-wide text-accent-teal">作品詳細</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {work.description}
            </p>
          </div>

          <div className="glass-panel rounded-sm p-6">
            <h2 className="mb-3 font-serif text-sm tracking-wide text-accent-teal">製作者コメント</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {work.comment}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-sm p-6">
              <h2 className="mb-3 font-serif text-sm tracking-wide text-accent-teal">担当人数</h2>
              <p className="text-[15px] text-ink-soft">{work.teamSize}人</p>
            </div>
            <div className="glass-panel rounded-sm p-6">
              <h2 className="mb-3 font-serif text-sm tracking-wide text-accent-teal">担当部分</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {work.role}
              </p>
            </div>
          </div>

          <div className="glass-panel space-y-4 rounded-sm p-6">
            <div>
              <h2 className="mb-2 font-serif text-sm tracking-wide text-accent-teal">カテゴリ</h2>
              <div className="flex flex-wrap gap-2">
                {work.category.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-serif text-sm tracking-wide text-accent-teal">使用技術</h2>
              <div className="flex flex-wrap gap-2">
                {work.techStack.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-ink-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
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

        <div className="mt-12 flex justify-center">
          <Link
            href="/works"
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-colors hover:bg-accent-teal hover:text-sky-deep"
          >
            ほかの作品もみる
          </Link>
        </div>
      </RevealFade>
    </section>
  );
}
