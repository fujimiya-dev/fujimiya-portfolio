import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExperienceForm from "@/components/ExperienceForm";
import { updateExperience } from "@/actions/experience";

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
      <h1 className="mb-6 font-serif text-2xl">「{item.org}」を編集</h1>
      <ExperienceForm action={boundUpdate} defaultValues={item} submitLabel="更新する" />
    </div>
  );
}
