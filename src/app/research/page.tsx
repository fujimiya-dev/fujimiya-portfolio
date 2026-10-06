import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResearchExplorer from "@/components/ResearchExplorer";
import { RevealGlow } from "@/components/RevealSection";
import SectionHeading from "@/components/SectionHeading";
import { getDictionary, getLocale } from "@/i18n/server";
import { withLocale } from "@/i18n/path";
import { resolveResearchItem } from "@/lib/resolveTranslation";

export const revalidate = 0;

export default async function ResearchPage() {
  const [items, dict, locale] = await Promise.all([
    prisma.researchItem.findMany({ orderBy: { order: "asc" }, include: { translations: true } }),
    getDictionary(),
    getLocale(),
  ]);
  const resolved = items.map((item) => resolveResearchItem(item, locale));

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <RevealGlow className="text-center">
        <span className="mb-7 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
          {dict.research.eyebrow}
        </span>
        <SectionHeading textKey="research" label={dict.nav.research} className="mx-auto mb-14 h-10 w-auto" />
      </RevealGlow>
      <ResearchExplorer items={resolved} locale={locale} />

      <div className="mt-12 flex justify-center">
        <Link
          href={withLocale("/contact", locale)}
          className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
        >
          {dict.research.ctaNext}
        </Link>
      </div>
    </section>
  );
}
