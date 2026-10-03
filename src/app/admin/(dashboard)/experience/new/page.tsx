import ExperienceForm from "@/components/ExperienceForm";
import { createExperience } from "@/actions/experience";
import AdminBackLink from "@/components/AdminBackLink";

export default function NewExperiencePage() {
  return (
    <div>
      <AdminBackLink />
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ExperienceForm action={createExperience} submitLabel="作成する" />
      </div>
    </div>
  );
}
