import Link from "next/link";
import { signOut } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";
import { RevealGlow } from "@/components/RevealSection";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-20">
      <RevealGlow className="mb-16 text-center">
        <Link href="/admin" className="inline-block">
          <SectionHeading textKey="management" label="Management" className="mx-auto h-10 w-auto" />
        </Link>
      </RevealGlow>

      {children}

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
