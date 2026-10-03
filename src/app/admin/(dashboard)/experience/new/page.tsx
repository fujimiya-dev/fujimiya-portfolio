import ExperienceForm from "@/components/ExperienceForm";
import { createExperience } from "@/actions/experience";
import AdminBackLink from "@/components/AdminBackLink";

export default function NewExperiencePage() {
  return (
    <div>
      <AdminBackLink />
      <h2 className="mb-6 text-center font-label text-2xl font-bold neon-label">
        新しい経歴を追加
      </h2>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ExperienceForm action={createExperience} submitLabel="作成する" />
      </div>
    </div>
  );
}
