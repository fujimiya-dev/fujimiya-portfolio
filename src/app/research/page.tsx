import { prisma } from "@/lib/prisma";
import ResearchExplorer from "@/components/ResearchExplorer";
import { RevealGlow } from "@/components/RevealSection";

export const revalidate = 0;

export default async function ResearchPage() {
  const items = await prisma.researchItem.findMany({ orderBy: { order: "asc" } });

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <RevealGlow>
        <span className="mb-4 flex items-center gap-2 text-xs tracking-widest text-accent-teal">
          <span className="font-serif text-base text-accent-moon">04</span>
          Research
        </span>
      </RevealGlow>
      <h2 className="mb-10 font-serif text-4xl font-bold">研究</h2>
      <ResearchExplorer items={items} />
    </section>
  );
}
