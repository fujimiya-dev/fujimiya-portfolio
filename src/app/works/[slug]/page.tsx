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
        <span className="mb-1 block font-serif text-sm text-accent-moon">{work.numberLabel}</span>
        <h1 className="mb-2 font-serif text-4xl font-bold">{work.title}</h1>
        <span className="mb-8 block text-xs text-ink-faint">
          {work.dateLabel}
          {work.award ? `　${work.award}` : ""}
        </span>

        <div className="glass-panel mb-8 border border-white/15 bg-white/[0.02] p-2">
          {work.imageUrl ? (
            <Image
              src={work.imageUrl}
              alt={work.title}
              width={960}
              height={600}
              className="h-auto w-full"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-xs text-ink-faint">
              画像未設定
            </div>
          )}
        </div>

        <p className="mb-6 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
          {work.description}
        </p>

        <div className="mb-8 space-y-3">
          <div>
            <p className="mb-2 text-xs tracking-wide text-ink-faint">カテゴリ</p>
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
            <p className="mb-2 text-xs tracking-wide text-ink-faint">使用技術</p>
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
      </RevealFade>
    </section>
  );
}
