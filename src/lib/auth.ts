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
    // Numeric GitHub user ID — stable across username changes, unlike login.
    signIn: async ({ profile }) => {
      return String(profile?.id) === process.env.ALLOWED_GITHUB_ID;
    },
    authorized: async ({ auth, request }) => {
      if (request.nextUrl.pathname.startsWith("/admin/login")) return true;
      return !!auth?.user;
    },
  },
});
