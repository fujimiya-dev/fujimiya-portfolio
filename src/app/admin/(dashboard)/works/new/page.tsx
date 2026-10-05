import WorkForm from "@/components/WorkForm";
import { createWork } from "@/actions/works";
import AdminListBackButton from "@/components/AdminListBackButton";

export default function NewWorkPage() {
  return (
    <div>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <WorkForm action={createWork} submitLabel="作成する" />
      </div>
      <AdminListBackButton href="/admin/works" label="Works編集一覧へ" />
    </div>
  );
}
