import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RevealFade } from "@/components/RevealSection";

export const revalidate = 0;

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.researchItem.findUnique({ where: { slug } });
  if (!item) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-28">
      <Link href="/research" className="neon-link mb-10 inline-block text-sm text-accent-blue hover:text-accent-teal">
        ← Research 一覧に戻る
      </Link>

      <RevealFade>
        <span className="mb-2 block text-xs tracking-wide text-accent-blue">{item.stage}</span>
        <h1 className="mb-8 font-label text-4xl font-bold leading-relaxed">{item.title}</h1>

        <div className="glass-panel relative mb-2 aspect-video overflow-hidden rounded-sm border border-white/15 bg-white/[0.02]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-contain"
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
        {item.caption && <p className="mb-8 text-center text-xs text-ink-faint">{item.caption}</p>}

        <div className="mb-8 space-y-4">
          <div className="glass-panel rounded-sm p-6">
            <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">概要</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{item.summary}</p>
          </div>

          <div className="glass-panel space-y-4 rounded-sm p-6">
            <div>
              <h2 className="neon-label mb-2 font-label text-sm tracking-wide text-accent-teal">タグ</h2>
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
            {item.techStack.length > 0 && (
              <div>
                <h2 className="neon-label mb-2 font-label text-sm tracking-wide text-accent-teal">使用技術</h2>
                <div className="flex flex-wrap gap-2">
                  {item.techStack.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {item.achievements.length > 0 && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">実績</h2>
              <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-ink-soft">
                {item.achievements.map((achievement) => (
                  <li key={achievement}>{achievement}</li>
                ))}
              </ul>
            </div>
          )}

          {item.references.length > 0 && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">主な参考文献</h2>
              <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-ink-soft">
                {item.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {item.paperUrl && (
          <a
            href={item.paperUrl}
            target="_blank"
            rel="noopener"
            className="neon-link border-b border-accent-blue/50 text-sm text-accent-blue transition-colors hover:border-accent-teal hover:text-accent-teal"
          >
            論文を見る ↗
          </a>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/research"
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
          >
            ほかの研究もみる
          </Link>
        </div>
      </RevealFade>
    </section>
  );
}
