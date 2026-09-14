import { prisma } from "@/lib/prisma";
import ExperienceExplorer from "@/components/ExperienceExplorer";
import { RevealGlow } from "@/components/RevealSection";
import { getDictionary } from "@/i18n/server";

export const revalidate = 0;

export default async function ExperiencePage() {
  const [items, dict] = await Promise.all([
    prisma.experience.findMany({ orderBy: { order: "asc" } }),
    getDictionary(),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <RevealGlow>
        <span className="mb-4 flex items-center gap-2 text-xs tracking-widest text-accent-teal">
          {dict.nav.experience}
        </span>
      </RevealGlow>
      <h2 className="mb-10 font-serif text-4xl font-bold">経験</h2>
      <ExperienceExplorer items={items} />
    </section>
  );
}
