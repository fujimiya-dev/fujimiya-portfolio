import { prisma } from "@/lib/prisma";
import ExperienceForm from "@/components/ExperienceForm";
import { createExperience } from "@/actions/experience";
import AdminListBackButton from "@/components/AdminListBackButton";

export default async function NewExperiencePage() {
  const works = await prisma.work.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } });

  return (
    <div>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ExperienceForm action={createExperience} submitLabel="作成する" allWorks={works} />
      </div>
      <AdminListBackButton href="/admin/experience" label="Experience編集一覧へ" />
    </div>
  );
}
