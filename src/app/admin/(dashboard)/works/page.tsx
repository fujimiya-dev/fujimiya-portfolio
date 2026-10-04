import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminListBackButton from "@/components/AdminListBackButton";
import WorksAdminList from "@/components/WorksAdminList";

export const revalidate = 0;

export default async function AdminWorksPage() {
  const works = await prisma.work.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, dateLabel: true },
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/works/new"
          className="neon-link rounded-sm border border-accent-teal px-4 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
        >
          + 新規作成
        </Link>
      </div>

      <p className="mb-3 text-xs text-ink-faint">ドラッグ&ドロップで並び替えできます(並び替えた結果はそのまま保存されます)</p>
      <WorksAdminList initialWorks={works} />
      <AdminListBackButton href="/admin" label="管理TOPへ" />
    </div>
  );
}
