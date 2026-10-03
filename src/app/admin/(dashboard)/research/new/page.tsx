import ResearchForm from "@/components/ResearchForm";
import { createResearchItem } from "@/actions/research";
import AdminBackLink from "@/components/AdminBackLink";

export default function NewResearchPage() {
  return (
    <div>
      <AdminBackLink />
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ResearchForm action={createResearchItem} submitLabel="作成する" />
      </div>
    </div>
  );
}
