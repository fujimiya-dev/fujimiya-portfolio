import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteExperience } from "@/actions/experience";

export const revalidate = 0;

export default async function AdminExperiencePage() {
  const items = await prisma.experience.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Experience の管理</h1>
        <Link
          href="/admin/experience/new"
          className="rounded-sm border border-accent-teal px-4 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
        >
          + 新規作成
        </Link>
      </div>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-serif">{item.org}</p>
              <p className="text-xs text-ink-faint">{item.dateLabel}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link
                href={`/admin/experience/${item.id}/edit`}
                className="text-accent-blue hover:text-accent-teal"
              >
                編集
              </Link>
              <form
                action={async () => {
                  "use server";
                  await deleteExperience(item.id);
                }}
              >
                <button className="text-red-400 hover:text-red-300">削除</button>
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-sm text-ink-faint">まだ経歴が登録されていません。</p>
        )}
      </div>
    </div>
  );
}
