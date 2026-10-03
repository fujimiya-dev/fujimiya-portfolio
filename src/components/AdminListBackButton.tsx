import Link from "next/link";

// 公開ページの「Worksへ」ボタン(src/app/page.tsx)と同じスタイル。
export default function AdminListBackButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-8 flex justify-center">
      <Link
        href={href}
        className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
      >
        {label}
      </Link>
    </div>
  );
}
