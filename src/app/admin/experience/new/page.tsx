import ExperienceForm from "@/components/ExperienceForm";
import { createExperience } from "@/actions/experience";

export default function NewExperiencePage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">新しい経歴を追加</h1>
      <ExperienceForm action={createExperience} submitLabel="作成する" />
    </div>
  );
}
