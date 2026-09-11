import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
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
      <h1 className="mb-8 font-serif text-2xl">ログイン</h1>
      <form action={login} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="メールアドレス"
          required
          className="w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal"
        />
        <input
          name="password"
          type="password"
          placeholder="パスワード"
          required
          className="w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal"
        />
        {error && (
          <p className="text-xs text-red-400">メールアドレスまたはパスワードが違います。</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-sm border border-accent-teal py-2 text-sm text-accent-teal transition-colors hover:bg-accent-teal hover:text-sky-deep"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}
