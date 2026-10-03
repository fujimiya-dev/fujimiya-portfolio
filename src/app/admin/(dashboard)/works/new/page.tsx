import WorkForm from "@/components/WorkForm";
import { createWork } from "@/actions/works";
import AdminBackLink from "@/components/AdminBackLink";

export default function NewWorkPage() {
  return (
    <div>
      <AdminBackLink />
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <WorkForm action={createWork} submitLabel="作成する" />
      </div>
    </div>
  );
}
