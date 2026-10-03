import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExperienceForm from "@/components/ExperienceForm";
import { updateExperience } from "@/actions/experience";
import AdminBackLink from "@/components/AdminBackLink";
import AdminListBackButton from "@/components/AdminListBackButton";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.experience.findUnique({ where: { id } });
  if (!item) notFound();

  const boundUpdate = updateExperience.bind(null, item.id);

  return (
    <div>
      <AdminBackLink />
      <h2 className="mb-6 text-center font-label text-2xl font-bold neon-label">
        「{item.org}」を編集
      </h2>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ExperienceForm action={boundUpdate} defaultValues={item} submitLabel="更新する" />
      </div>
      <AdminListBackButton href="/admin/experience" label="Experience編集一覧に戻る" />
    </div>
  );
}
