import WorkForm from "@/components/WorkForm";
import { createWork } from "@/actions/works";
import AdminBackLink from "@/components/AdminBackLink";

export default function NewWorkPage() {
  return (
    <div>
      <AdminBackLink />
      <h2 className="mb-6 text-center font-label text-2xl font-bold neon-label">
        新しい制作物を追加
      </h2>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <WorkForm action={createWork} submitLabel="作成する" />
      </div>
    </div>
  );
}
