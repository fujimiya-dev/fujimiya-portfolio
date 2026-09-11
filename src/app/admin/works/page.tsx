import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteWork } from "@/actions/works";

export const revalidate = 0;

export default async function AdminWorksPage() {
  const works = await prisma.work.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Works の管理</h1>
        <Link
          href="/admin/works/new"
          className="rounded-sm border border-accent-teal px-4 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
        >
          + 新規作成
        </Link>
      </div>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {works.map((work) => (
          <div key={work.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-serif">{work.title}</p>
              <p className="text-xs text-ink-faint">{work.dateLabel}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href={`/admin/works/${work.id}/edit`} className="text-accent-blue hover:text-accent-teal">
                編集
              </Link>
              <form
                action={async () => {
                  "use server";
                  await deleteWork(work.id);
                }}
              >
                <button className="text-red-400 hover:text-red-300">削除</button>
              </form>
            </div>
          </div>
        ))}
        {works.length === 0 && (
          <p className="py-6 text-sm text-ink-faint">まだ制作物が登録されていません。</p>
        )}
      </div>
    </div>
  );
}
