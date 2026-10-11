import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExperienceExplorer from "@/components/ExperienceExplorer";
import { RevealGlow } from "@/components/RevealSection";
import SectionHeading from "@/components/SectionHeading";
import { getDictionary, getLocale } from "@/i18n/server";
import { withLocale } from "@/i18n/path";
import { resolveExperience, resolveWork } from "@/lib/resolveTranslation";

export const revalidate = 0;

export default async function ExperiencePage() {
  // Work is fetched in full (same query /works/page.tsx already runs) in the
  // same Promise.all as the Experience query, instead of a separate
  // `where: { id: { in: allWorkIds } }` query issued *after* awaiting the
  // Experience query — that second query depended on allWorkIds (derived
  // from the first query's result), forcing two round-trips to the database
  // in sequence. Works tables are small, so fetching all of them unfiltered
  // and narrowing to each Experience's workIds in JS below removes that
  // dependency entirely, cutting one full DB round-trip off this page.
  const [items, allWorks, dict, locale] = await Promise.all([
    prisma.experience.findMany({ orderBy: { order: "asc" }, include: { translations: true } }),
    prisma.work.findMany({ include: { translations: true } }),
    getDictionary(),
    getLocale(),
  ]);

  const workById = new Map(allWorks.map((work) => [work.id, resolveWork(work, locale)]));

  const resolved = items.map((item) => ({
    ...resolveExperience(item, locale),
    // Preserves workIds' own order (the admin-selected display order) and
    // silently drops any id whose Work has since been deleted, rather than
    // relying on findMany()'s (unordered) result order or erroring.
    works: item.workIds
      .map((id) => workById.get(id))
      .filter((work): work is NonNullable<typeof work> => work != null)
      .map((work) => ({ slug: work.slug, title: work.title })),
  }));

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <RevealGlow className="text-center">
        <span className="mb-7 flex items-center justify-center gap-2 heading-eyebrow tracking-widest text-accent-teal">
          {dict.experience.eyebrow}
        </span>
        <SectionHeading textKey="experience" label={dict.nav.experience} className="heading-xl mx-auto mb-14 w-auto" />
      </RevealGlow>
      <ExperienceExplorer items={resolved} locale={locale} dict={dict.experience} />

      <div className="mt-12 flex justify-center">
        <Link
          href={withLocale("/research", locale)}
          className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
        >
          {dict.experience.ctaNext}
        </Link>
      </div>
    </section>
  );
}
