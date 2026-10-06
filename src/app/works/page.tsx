import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WorksExplorer from "@/components/WorksExplorer";
import { RevealGlow } from "@/components/RevealSection";
import SectionHeading from "@/components/SectionHeading";
import { getDictionary, getLocale } from "@/i18n/server";
import { withLocale } from "@/i18n/path";
import { resolveWork } from "@/lib/resolveTranslation";

export const revalidate = 0;

export default async function WorksPage() {
  const [works, dict, locale] = await Promise.all([
    prisma.work.findMany({ orderBy: { order: "asc" }, include: { translations: true } }),
    getDictionary(),
    getLocale(),
  ]);
  const resolved = works.map((w) => resolveWork(w, locale));

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <RevealGlow className="text-center">
        <span className="mb-7 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
          {dict.works.eyebrow}
        </span>
        <SectionHeading textKey="works" label={dict.nav.works} className="mx-auto mb-14 h-10 w-auto" />
      </RevealGlow>
      <WorksExplorer works={resolved} locale={locale} dict={dict.works} />

      <div className="mt-12 flex justify-center">
        <Link
          href={withLocale("/experience", locale)}
          className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
        >
          {dict.works.ctaNext}
        </Link>
      </div>
    </section>
  );
}
