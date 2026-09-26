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
      <RevealGlow className="text-center">
        <span className="mb-4 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
          研究
        </span>
        <h2 className="mb-10 font-display text-4xl font-bold">{dict.nav.research}</h2>
      </RevealGlow>
      <ResearchExplorer items={items} />

      <div className="mt-12 flex justify-center">
        <Link
          href="/other"
          className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
        >
          Otherへ
        </Link>
      </div>
    </section>
  );
}
