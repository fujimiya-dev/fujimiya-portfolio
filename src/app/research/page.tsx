import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResearchExplorer from "@/components/ResearchExplorer";
import { RevealGlow } from "@/components/RevealSection";
import { getDictionary } from "@/i18n/server";

export const revalidate = 0;

export default async function ResearchPage() {
  const [items, dict] = await Promise.all([
    prisma.researchItem.findMany({ orderBy: { order: "asc" } }),
    getDictionary(),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <RevealGlow>
        <span className="mb-4 flex items-center gap-2 text-xs tracking-widest text-accent-teal text-glow-accent">
          研究
        </span>
      </RevealGlow>
      <h2 className="mb-10 font-serif text-4xl font-bold">{dict.nav.research}</h2>
      <ResearchExplorer items={items} />

      <div className="mt-12 flex justify-center">
        <Link
          href="/other"
          className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-colors hover:bg-accent-teal hover:text-sky-deep"
        >
          Otherへ
        </Link>
      </div>
    </section>
  );
}
