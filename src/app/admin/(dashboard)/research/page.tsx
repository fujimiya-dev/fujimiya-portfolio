import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteResearchItem } from "@/actions/research";
import AdminListBackButton from "@/components/AdminListBackButton";

export const revalidate = 0;

export default async function AdminResearchPage() {
  const items = await prisma.researchItem.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/research/new"
          className="neon-link rounded-sm border border-accent-teal px-4 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
        >
          + 新規作成
        </Link>
      </div>

      <div className="glass-panel divide-y divide-white/10 rounded-sm px-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-label">{item.title}</p>
              <p className="text-xs text-ink-faint">{item.stage}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link
                href={`/admin/research/${item.id}/edit`}
                className="neon-link text-accent-blue hover:text-accent-teal"
              >
                編集
              </Link>
              <form
                action={async () => {
                  "use server";
                  await deleteResearchItem(item.id);
                }}
              >
                <button className="neon-link text-red-400 hover:text-red-300">削除</button>
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-sm text-ink-faint">まだ研究が登録されていません。</p>
        )}
      </div>
      <AdminListBackButton href="/admin" label="管理TOPへ戻る" />
    </div>
  );
}
