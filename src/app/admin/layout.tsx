import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-24">
      <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
        <Link href="/admin" className="font-serif text-xl">
          管理画面
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-xs text-ink-faint hover:text-accent-teal">
            ログアウト
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
