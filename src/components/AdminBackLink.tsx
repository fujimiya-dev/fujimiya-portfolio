import Link from "next/link";

export default function AdminBackLink() {
  return (
    <Link
      href="/admin"
      className="neon-link mb-6 inline-flex items-center gap-1 text-xs text-ink-faint hover:text-accent-teal"
    >
      ← 管理TOPへ
    </Link>
  );
}
