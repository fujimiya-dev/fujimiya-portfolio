import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExperienceForm from "@/components/ExperienceForm";
import { updateExperience } from "@/actions/experience";
import AdminListBackButton from "@/components/AdminListBackButton";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.experience.findUnique({ where: { id }, include: { translations: true } });
  if (!item) notFound();

  const boundUpdate = updateExperience.bind(null, item.id);
  const en = item.translations.find((t) => t.locale === "en");

  return (
    <div>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ExperienceForm
          action={boundUpdate}
          defaultValues={{
            ...item,
            orgEn: en?.org,
            dateLabelEn: en?.dateLabel,
            summaryEn: en?.summary,
          }}
          submitLabel="更新する"
        />
      </div>
      <AdminListBackButton href="/admin/experience" label="Experience編集一覧へ" />
    </div>
  );
}
