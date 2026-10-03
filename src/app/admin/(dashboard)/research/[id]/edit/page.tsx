import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResearchForm from "@/components/ResearchForm";
import { updateResearchItem } from "@/actions/research";
import AdminBackLink from "@/components/AdminBackLink";

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
      <AdminBackLink />
      <h2 className="mb-6 text-center font-label text-2xl font-bold neon-label">
        「{item.title}」を編集
      </h2>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ResearchForm action={boundUpdate} defaultValues={item} submitLabel="更新する" />
      </div>
    </div>
  );
}
