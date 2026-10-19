"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Measurement ID comes from Vercel's env vars, never committed — NEXT_PUBLIC_
// so it's readable client-side (required: the hostname/path gating below can
// only run in the browser). If it's unset (local dev, or simply not
// configured yet), nothing renders and no request to Google is ever made.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Only the real production domain gets measured — not localhost, and not a
// Vercel preview/branch deployment's own *.vercel.app URL (every git push
// gets one of those; counting them as real traffic would pollute the
// property). Checked against window.location.hostname rather than Vercel's
// own VERCEL_ENV (which is a build-time/server-only value next/script can't
// read from the client bundle) — this way the same build artifact behaves
// correctly regardless of which URL it ends up served from.
const PRODUCTION_HOSTNAME = "portfolio.fujimiya.dev";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  // Starts false on both the server render and the client's first render
  // (window isn't available server-side, and checking it in render would
  // desync from SSR output) — only flips after mount, once the real
  // hostname can actually be read. No hydration mismatch: both the server
  // and the client's initial paint agree on "render nothing".
  const [isProductionHost, setIsProductionHost] = useState(false);

  useEffect(() => {
    setIsProductionHost(window.location.hostname === PRODUCTION_HOSTNAME);
  }, []);

  // /admin (including /admin/login) is never measured — it's the owner's
  // own usage, not a visitor's, and would otherwise skew every pageview
  // metric on the property. No separate /login route exists outside /admin.
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!GA_ID || !isProductionHost || isAdminPath) return null;

  return (
    <>
      {/* afterInteractive (not beforeInteractive/default): loads once the
          page is already interactive, specifically so it never competes
          with or delays the opening animation, font loading, or the WebGL
          scene's own startup for bandwidth/main-thread time. */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
