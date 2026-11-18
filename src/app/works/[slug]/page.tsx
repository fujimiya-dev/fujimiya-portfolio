import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RevealFade } from "@/components/RevealSection";
import NoImage from "@/components/NoImage";
import WorkGallery from "@/components/WorkGallery";
import CollapsibleComment from "@/components/CollapsibleComment";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { getDictionary, getLocale } from "@/i18n/server";
import { withLocale } from "@/i18n/path";
import { translateTag } from "@/lib/tagLabels";
import { resolveWork } from "@/lib/resolveTranslation";

export const revalidate = 0;

const FETCH_RETRY_ATTEMPTS = 3;
const FETCH_RETRY_DELAY_MS = 500;

// A single unguarded prisma call here meant any transient connection
// failure (e.g. Neon's compute waking from auto-suspend — the first query
// after a period of no traffic — taking longer than Prisma's default
// connect_timeout) surfaced as an uncaught exception, with nothing in the
// Vercel logs to point at *why*. Retries a few times with a short backoff
// before giving up; every failed attempt is logged with the slug so a
// recurrence is diagnosable from the logs alone.
//
// Wrapped in React's cache() so generateMetadata and the page component
// (both calling this with the same slug during one request) share a single
// fetch instead of querying the DB twice.
const fetchWorkBySlug = cache(async (slug: string) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_RETRY_ATTEMPTS; attempt++) {
    try {
      return await prisma.work.findUnique({ where: { slug }, include: { translations: true } });
    } catch (err) {
      lastError = err;
      console.error(`[works/${slug}] prisma.work.findUnique failed (attempt ${attempt}/${FETCH_RETRY_ATTEMPTS}):`, err);
      if (attempt < FETCH_RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_DELAY_MS * attempt));
      }
    }
  }
  // Exhausted retries — rethrow rather than treating this as "not found".
  // A genuinely missing slug and a DB the app couldn't reach are different
  // situations: the former is a 404, the latter should surface as an error
  // (caught by error.tsx) so it isn't mistaken for the page being deleted.
  throw lastError;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [workRaw, dict, locale] = await Promise.all([fetchWorkBySlug(slug), getDictionary(), getLocale()]);
  if (!workRaw) return { title: dict.nav.works };
  const work = resolveWork(workRaw, locale);
  return { title: `${work.title}${locale === "en" ? " | " : "｜"}${dict.nav.works}` };
}

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
  const [workRaw, dict, locale] = await Promise.all([fetchWorkBySlug(slug), getDictionary(), getLocale()]);
  if (!workRaw) {
    console.error(`[works/${slug}] query succeeded but returned no matching work`);
    notFound();
  }
  const work = resolveWork(workRaw, locale);

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-28">
      <Link href={withLocale("/works", locale)} className="neon-link mb-10 inline-block text-sm text-accent-blue hover:text-accent-teal">
        {dict.workDetail.backToList}
      </Link>

      <RevealFade>
        <h1 className="mb-8 text-center font-label text-4xl font-bold">{work.title}</h1>

        {/* ギャラリー — right under the title; self-contained (returns null
            when there are no screenshots, so an empty gallery leaves 作品紹介
            directly under the title, same as if this weren't here at all)
            and already carries its own mb-8, matching the rhythm of every
            other top-level block on this page. */}
        <WorkGallery images={work.screenshots} alt={work.title} galleryLabel={dict.workDetail.gallery} />

        <div className="mb-8 space-y-4">
          <div className="glass-panel rounded-sm p-6">
            <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.details}</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {work.description}
            </p>
          </div>

          <div className="glass-panel space-y-4 rounded-sm p-6">
            <div>
              <h2 className="neon-label heading-fieldlabel mb-2 font-label tracking-wide text-accent-teal">{dict.workDetail.category}</h2>
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
            </div>
            <div>
              <h2 className="neon-label heading-fieldlabel mb-2 font-label tracking-wide text-accent-teal">{dict.workDetail.techStack}</h2>
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

          {/* 制作期間 — same box treatment as the other info panels (not
              plain text under the title, and not inside the category/tech
              panel above — its own standalone panel, same as before). */}
          <div className="glass-panel rounded-sm p-6">
            <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.period}</h2>
            <p className="text-[15px] text-ink-soft">{work.dateLabel}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.teamSize}</h2>
              <p className="text-[15px] text-ink-soft">{work.teamSize}{dict.workDetail.teamSizeSuffix}</p>
            </div>
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.role}</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {work.role}
              </p>
            </div>
          </div>

          {work.award && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.award}</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{work.award}</p>
            </div>
          )}

          <div className="glass-panel rounded-sm p-6">
            <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.comment}</h2>
            <CollapsibleComment
              text={work.comment}
              showMoreLabel={dict.workDetail.showMore}
              showLessLabel={dict.workDetail.showLess}
            />
          </div>

          {work.demoUrl && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.demoUrl}</h2>
              <a
                href={work.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neon-link break-all text-[15px] text-accent-blue underline underline-offset-2 hover:text-accent-teal"
              >
                {work.demoUrl}
              </a>
            </div>
          )}

          {work.githubUrl && (
            <div className="glass-panel rounded-sm p-6">
              <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.githubUrl}</h2>
              <a
                href={work.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neon-link break-all text-[15px] text-accent-blue underline underline-offset-2 hover:text-accent-teal"
              >
                {work.githubUrl}
              </a>
            </div>
          )}
        </div>

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

        {/* クレジット — last on the page now, after the demo video. */}
        {work.credits && (
          <div className="glass-panel mb-8 rounded-sm p-6">
            <h2 className="neon-label heading-fieldlabel mb-3 font-label tracking-wide text-accent-teal">{dict.workDetail.credits}</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
              {renderWithLinks(work.credits)}
            </p>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href={withLocale("/works", locale)}
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
          >
            {dict.workDetail.viewMore}
          </Link>
        </div>
      </RevealFade>
    </section>
  );
}
