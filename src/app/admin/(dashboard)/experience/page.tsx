import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminListBackButton from "@/components/AdminListBackButton";
import ExperienceAdminList from "@/components/ExperienceAdminList";

export const revalidate = 0;

export default async function AdminExperiencePage() {
  const items = await prisma.experience.findMany({
    orderBy: { order: "asc" },
    select: { id: true, org: true, dateLabel: true },
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/experience/new"
          className="neon-link rounded-sm border border-accent-teal px-4 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
        >
          + 新規作成
        </Link>
      </div>

      <p className="mb-3 text-xs text-ink-faint">ドラッグ&ドロップで並び替えできます(並び替えた結果はそのまま保存されます)</p>
      <ExperienceAdminList initialItems={items} />
      <AdminListBackButton href="/admin" label="管理TOPへ" />
    </div>
  );
}
