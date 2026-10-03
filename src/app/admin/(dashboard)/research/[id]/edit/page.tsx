import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResearchForm from "@/components/ResearchForm";
import { updateResearchItem } from "@/actions/research";
import AdminListBackButton from "@/components/AdminListBackButton";

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
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ResearchForm action={boundUpdate} defaultValues={item} submitLabel="更新する" />
      </div>
      <AdminListBackButton href="/admin/research" label="Research編集一覧へ" />
    </div>
  );
}
