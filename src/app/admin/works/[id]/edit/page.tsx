import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkForm from "@/components/WorkForm";
import { updateWork } from "@/actions/works";

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
      <h1 className="mb-6 font-serif text-2xl">「{work.title}」を編集</h1>
      <WorkForm action={boundUpdate} defaultValues={work} submitLabel="更新する" />
    </div>
  );
}
