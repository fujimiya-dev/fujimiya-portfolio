import ResearchForm from "@/components/ResearchForm";
import { createResearchItem } from "@/actions/research";
import AdminBackLink from "@/components/AdminBackLink";

export default function NewResearchPage() {
  return (
    <div>
      <AdminBackLink />
      <h2 className="mb-6 text-center font-label text-2xl font-bold neon-label">
        新しい研究を追加
      </h2>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ResearchForm action={createResearchItem} submitLabel="作成する" />
      </div>
    </div>
  );
}
