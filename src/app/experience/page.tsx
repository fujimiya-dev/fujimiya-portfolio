import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ExperienceExplorer from "@/components/ExperienceExplorer";
import { RevealGlow } from "@/components/RevealSection";
import SectionHeading from "@/components/SectionHeading";
import { getDictionary } from "@/i18n/server";

export const revalidate = 0;

export default async function ExperiencePage() {
  const [items, dict] = await Promise.all([
    prisma.experience.findMany({ orderBy: { order: "asc" } }),
    getDictionary(),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <RevealGlow className="text-center">
        <span className="mb-4 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
          行ってきたこと
        </span>
        <SectionHeading textKey="experience" label={dict.nav.experience} className="mx-auto mb-14 h-10 w-auto" />
      </RevealGlow>
      <ExperienceExplorer items={items} />

      <div className="mt-12 flex justify-center">
        <Link
          href="/research"
          className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
        >
          Researchへ
        </Link>
      </div>
    </section>
  );
}
