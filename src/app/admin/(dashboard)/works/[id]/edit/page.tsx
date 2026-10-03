import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkForm from "@/components/WorkForm";
import { updateWork } from "@/actions/works";
import AdminBackLink from "@/components/AdminBackLink";

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({ where: { id } });
  if (!work) notFound();

  const boundUpdate = updateWork.bind(null, work.id);

  return (
    <div>
      <AdminBackLink />
      <h2 className="mb-6 text-center font-label text-2xl font-bold neon-label">
        「{work.title}」を編集
      </h2>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <WorkForm action={boundUpdate} defaultValues={work} submitLabel="更新する" />
      </div>
    </div>
  );
}
