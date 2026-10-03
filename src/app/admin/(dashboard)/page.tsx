import Link from "next/link";
import AdminSectionTitle from "@/components/AdminSectionTitle";
import { signOut } from "@/lib/auth";

const sections = [
  { href: "/admin/works", label: "Works", note: "制作物の追加・編集・削除" },
  { href: "/admin/experience", label: "Experience", note: "経歴の追加・編集・削除" },
  { href: "/admin/research", label: "Research", note: "研究内容の追加・編集・削除" },
];

export default function AdminHome() {
  return (
    <div>
      <AdminSectionTitle textKey="admin" label="Admin" eyebrow="管理" />
      <div className="grid gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="glass-panel block rounded-sm p-6 transition-colors hover:border-accent-teal/60"
          >
            <p className="neon-link font-label text-lg">{s.label}</p>
            <p className="mt-1 text-xs text-ink-faint">{s.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]">
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}
