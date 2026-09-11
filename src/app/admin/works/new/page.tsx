import WorkForm from "@/components/WorkForm";
import { createWork } from "@/actions/works";

export default function NewWorkPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">新しい制作物を追加</h1>
      <WorkForm action={createWork} submitLabel="作成する" />
    </div>
  );
}
