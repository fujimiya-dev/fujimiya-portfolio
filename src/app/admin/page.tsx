import Link from "next/link";

const sections = [
  { href: "/admin/works", label: "Works", note: "制作物の追加・編集・削除" },
  { href: "/admin/experience", label: "Experience", note: "（未実装：Worksと同じパターンで追加できます）" },
  { href: "/admin/research", label: "Research", note: "（未実装：Worksと同じパターンで追加できます）" },
];

export default function AdminHome() {
  return (
    <div className="grid gap-4">
      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className="glass-panel block rounded-sm p-6 transition-colors hover:border-accent-teal/60"
        >
          <p className="font-serif text-lg">{s.label}</p>
          <p className="mt-1 text-xs text-ink-faint">{s.note}</p>
        </Link>
      ))}
    </div>
  );
}
