import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Checks the numeric GitHub user ID (stable across username changes)
    // and, during migration, also still accepts the old username-based
    // check as a fallback. Remove the ALLOWED_GITHUB_USERNAME branch once
    // ALLOWED_GITHUB_ID is confirmed working in production.
    signIn: async ({ profile }) => {
      const matchesId = String(profile?.id) === process.env.ALLOWED_GITHUB_ID;
      const matchesUsername = profile?.login === process.env.ALLOWED_GITHUB_USERNAME;
      return matchesId || matchesUsername;
    },
    authorized: async ({ auth, request }) => {
      if (request.nextUrl.pathname.startsWith("/admin/login")) return true;
      return !!auth?.user;
    },
  },
});
