import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResearchForm from "@/components/ResearchForm";
import { updateResearchItem } from "@/actions/research";

export default async function EditResearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.researchItem.findUnique({ where: { id } });
  if (!item) notFound();

  const boundUpdate = updateResearchItem.bind(null, item.id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">「{item.title}」を編集</h1>
      <ResearchForm action={boundUpdate} defaultValues={item} submitLabel="更新する" />
    </div>
  );
}
