import ResearchForm from "@/components/ResearchForm";
import { createResearchItem } from "@/actions/research";
import AdminListBackButton from "@/components/AdminListBackButton";

export default function NewResearchPage() {
  return (
    <div>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <ResearchForm action={createResearchItem} submitLabel="作成する" />
      </div>
      <AdminListBackButton href="/admin/research" label="Research編集一覧へ" />
    </div>
  );
}
