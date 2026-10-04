import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RevealFade } from "@/components/RevealSection";
import NoImage from "@/components/NoImage";
import WorkGallery from "@/components/WorkGallery";
import { youtubeEmbedUrl } from "@/lib/youtube";

export const revalidate = 0;

// Credits text is free-form, admin-entered multiline text that may contain
// URLs (e.g. "楽曲:曲名 https://..."). whitespace-pre-line on the
// containing element preserves the line breaks already in the string; this
// only needs to additionally turn the URL segments into actual links.
function renderWithLinks(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="neon-link text-accent-blue underline underline-offset-2 hover:text-accent-teal"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

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
      <Link href="/works" className="neon-link mb-10 inline-block text-sm text-accent-blue hover:text-accent-teal">
        ← Works 一覧に戻る
      </Link>

      <RevealFade>
        <h1 className="mb-2 font-label text-4xl font-bold">{work.title}</h1>
        <span className="mb-8 block text-sm text-ink-faint">{work.dateLabel}</span>

        <div className="glass-panel relative mb-8 aspect-video overflow-hidden rounded-sm border border-white/15 bg-white/[0.02]">
          {work.youtubeId ? (
            <iframe
              src={youtubeEmbedUrl(work.youtubeId)}
              title={work.title}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : work.imageUrl ? (
            <Image
              src={work.imageUrl}
              alt={work.title}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-contain"
            />
          ) : (
            <NoImage />
          )}
        </div>

        <WorkGallery images={work.screenshots} alt={work.title} />

        <div className="mb-8 space-y-4">
          {work.award && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">受賞歴</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{work.award}</p>
            </div>
          )}

          <div className="glass-panel rounded-sm p-6">
            <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">作品詳細</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {work.description}
            </p>
          </div>

          <div className="glass-panel rounded-sm p-6">
            <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">製作者コメント</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {work.comment}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">担当人数</h2>
              <p className="text-[15px] text-ink-soft">{work.teamSize}人</p>
            </div>
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">担当部分</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {work.role}
              </p>
            </div>
          </div>

          <div className="glass-panel space-y-4 rounded-sm p-6">
            <div>
              <h2 className="neon-label mb-2 font-label text-sm tracking-wide text-accent-teal">カテゴリ</h2>
              <div className="flex flex-wrap gap-2">
                {work.category.map((tag) => (
                  <span
                    key={tag}
                    className="neon-tag rounded-full border border-accent-teal/35 bg-accent-teal/10 px-3 py-1 text-xs text-accent-teal"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="neon-label mb-2 font-label text-sm tracking-wide text-accent-teal">使用技術</h2>
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

          {work.credits && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">クレジット</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {renderWithLinks(work.credits)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/works"
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
          >
            ほかの作品もみる
          </Link>
        </div>
      </RevealFade>
    </section>
  );
}
