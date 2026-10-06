import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Path-based locale routing: "/en" and "/en/..." are rewritten internally to
// the same route tree that serves "/" and "/...", with an "x-locale: en"
// request header set so getLocale() (src/i18n/server.ts) knows which locale
// to render — the browser URL stays "/en/...". Every other path renders as
// "ja" via "x-locale: ja". This keeps a single page.tsx per route (no
// duplicated /en/* files) while giving English pages their own indexable
// URLs, unlike the old cookie-only toggle.
//
// Admin is deliberately JA-only and never served under /en — it keeps its
// existing auth-gated matcher, now expressed as a branch here instead of a
// separate middleware export, since this file needs to run on every path
// (not just /admin/*) to set the locale header.
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en/admin" || pathname.startsWith("/en/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    return (auth as unknown as (req: NextRequest) => Promise<Response | undefined>)(request);
  }

  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", isEn ? "en" : "ja");

  if (isEn) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/en" ? "/" : pathname.slice(3);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
