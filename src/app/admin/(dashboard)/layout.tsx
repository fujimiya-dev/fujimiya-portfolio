import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-24">
      <div className="relative mb-10 border-b border-white/10 pb-6">
        <h1 className="text-center font-label text-2xl font-bold">
          <Link href="/admin" className="neon-label neon-link">
            管理画面
          </Link>
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2"
        >
          <button className="neon-link text-xs text-ink-faint hover:text-accent-teal">
            ログアウト
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
