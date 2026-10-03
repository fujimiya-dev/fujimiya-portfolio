import Link from "next/link";
import { signOut } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-24">
      <div className="relative mb-10 border-b border-white/10 pb-6">
        <Link href="/admin" className="flex justify-center">
          <SectionHeading textKey="management" label="Management" className="h-10 w-auto" />
        </Link>
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
