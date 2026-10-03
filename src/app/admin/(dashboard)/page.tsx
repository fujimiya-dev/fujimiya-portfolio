import Link from "next/link";
import AdminSectionTitle from "@/components/AdminSectionTitle";

const sections = [
  { href: "/admin/works", label: "Works", note: "制作物の追加・編集・削除" },
  { href: "/admin/experience", label: "Experience", note: "経歴の追加・編集・削除" },
  { href: "/admin/research", label: "Research", note: "研究内容の追加・編集・削除" },
];

export default function AdminHome() {
  return (
    <div>
      <AdminSectionTitle textKey="admin" label="Admin" />
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
    </div>
  );
}
