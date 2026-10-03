import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { RevealGlow } from "@/components/RevealSection";
import SectionHeading from "@/components/SectionHeading";

async function login() {
  "use server";
  try {
    await signIn("github", { redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-6 pb-24 pt-28">
      <RevealGlow className="text-center">
        <SectionHeading textKey="login" label="Login" className="mx-auto mb-8 h-10 w-auto" />
      </RevealGlow>
      <div className="glass-panel rounded-sm p-6 sm:p-8">
        <form action={login}>
          {error && (
            <p className="mb-4 text-xs text-red-400">
              このGitHubアカウントにはログインが許可されていません。
            </p>
          )}
          <button
            type="submit"
            className="neon-link flex w-full items-center justify-center gap-2 rounded-sm border border-accent-teal py-2 text-sm text-accent-teal transition-colors hover:bg-accent-teal hover:text-sky-deep"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHubでログイン
          </button>
        </form>
      </div>
    </div>
  );
}
