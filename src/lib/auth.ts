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
    signIn: async ({ profile }) => {
      return profile?.login === process.env.ALLOWED_GITHUB_USERNAME;
    },
    authorized: async ({ auth, request }) => {
      if (request.nextUrl.pathname.startsWith("/admin/login")) return true;
      return !!auth?.user;
    },
  },
});
