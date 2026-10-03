import ResearchForm from "@/components/ResearchForm";
import { createResearchItem } from "@/actions/research";

export default function NewResearchPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">新しい研究を追加</h1>
      <ResearchForm action={createResearchItem} submitLabel="作成する" />
    </div>
  );
}
