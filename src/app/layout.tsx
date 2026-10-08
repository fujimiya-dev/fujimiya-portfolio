import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import NightSky from "@/components/night-sky/NightSky";
import { IntroPlayingProvider } from "@/components/IntroPlayingContext";
import { getLocale } from "@/i18n/server";

const zenOldMincho = localFont({
  src: [
    { path: "../fonts/zen-old-mincho/ZenOldMincho-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/zen-old-mincho/ZenOldMincho-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/zen-old-mincho/ZenOldMincho-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/zen-old-mincho/ZenOldMincho-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/zen-old-mincho/ZenOldMincho-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

const zenKaku = localFont({
  src: [
    { path: "../fonts/zen-kaku-gothic-new/ZenKakuGothicNew-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/zen-kaku-gothic-new/ZenKakuGothicNew-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/zen-kaku-gothic-new/ZenKakuGothicNew-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/zen-kaku-gothic-new/ZenKakuGothicNew-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-zen-kaku",
  display: "swap",
});

// Marcellus/Kaisei Decol were replaced by Hina Mincho for both the display
// and label roles. The same ttf is loaded twice under two variable names so
// the existing font-display/font-label call sites (19 files) don't need to
// change. src/fonts/marcellus/ and src/fonts/kaisei-decol/ are left in place
// (unused for now) in case this gets reverted.
const hinaMincho = localFont({
  src: [{ path: "../fonts/hina-mincho/HinaMincho-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});

const hinaMinchoLabel = localFont({
  src: [{ path: "../fonts/hina-mincho/HinaMincho-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-label",
  display: "swap",
});

const nothingYouCouldDo = localFont({
  src: [
    { path: "../fonts/nothing-you-could-do/NothingYouCouldDo-Regular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-intro",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const description =
    locale === "en"
      ? "Portfolio of Fujimiya, a 1st-year Master's student at JAIST."
      : "北陸先端科学技術大学院大学 修士1年 ふじみやのポートフォリオ";

  return {
    metadataBase: new URL("https://portfolio.fujimiya.dev"),
    title: "Fujimiya",
    description,
    alternates: {
      languages: { ja: "/", en: "/en" },
    },
    openGraph: {
      title: "Fujimiya Portfolio",
      description: "Welcome to Fujimiya's Portfolio!",
      type: "website",
      images: [{ url: "/ogp-image.png", width: 1200, height: 630, alt: "Fujimiya.dev" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Fujimiya Portfolio",
      description: "Welcome to Fujimiya's Portfolio!",
      images: ["/ogp-image.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  // Set by middleware.ts from the request path, before the "/en" rewrite —
  // true only for "/" and "/en", the two paths that render page.tsx (and
  // so the only ones IntroOverlay may ever autoplay on). See the comment on
  // #intro-preboot below for why this needs to be known this early.
  const isHome = (await headers()).get("x-is-home") === "1";

  return (
    <html
      lang={locale}
      className={`${zenOldMincho.variable} ${zenKaku.variable} ${hinaMincho.variable} ${hinaMinchoLabel.variable} ${nothingYouCouldDo.variable}`}
    >
      <body className="grid min-h-screen grid-rows-[1fr_auto] font-sans">
        {/* Covers the screen in the intro's own black (#020308) from the
            very first byte of HTML — before the JS bundle loads, before
            React hydrates — so there's no gap where the plain page (Hero
            text, nav, CSS-only sky gradient) is visible ahead of the intro.
            IntroOverlay can't render anything itself until after hydration
            confirms document.body exists (it portals there), which left
            exactly that gap. Rendered as a sibling of NightSky/TopNav/main
            below — not nested inside main's own stacking context — at the
            maximum z-index, so it reliably covers the header too (same
            reason IntroOverlay itself portals to document.body instead of
            z-index-ing from inside main).

            Always rendered, on every route — never conditional on isHome —
            and never removed from the DOM, only ever hidden via its own
            `display` style. Both of those were the actual bug an earlier
            version of this had: that version wrapped this whole block in
            `{isHome && (...)}`, so navigating client-side from "/" to a
            non-home route (where isHome flips to false) made this block's
            presence a tree-shape change, which forces React to unmount it —
            except IntroOverlay's own effect had *already* called
            `.remove()` on the div directly, so by the time React tried to
            unmount/reorder it during that navigation's reconciliation, the
            real DOM node was already gone and `removeChild`/`insertBefore`
            threw (confirmed via a production build + a scripted repro:
            "NotFoundError: Failed to execute 'removeChild' on 'Node'"),
            which corrupted the whole commit and crashed the app. Fixed on
            both ends: this div's presence in the tree never changes again
            (only its `display` style does, driven by isHome below), and
            IntroOverlay (see its own comment) now only ever toggles
            `style.display`, never calls `.remove()`.

            Hidden by whichever of these actually ends up happening:
            - isHome itself being false (a non-home route) — set directly
              in the style below, so SSR for those routes never paints this
              covering in the first place
            - the inline script below, synchronously, if the URL already
              has a hash (intro won't autoplay — e.g. "/#about")
            - the inline script's own 5s fallback timer, if hydration never
              completes at all (paired with the <noscript> rule below,
              which acts immediately rather than waiting 5s, for the
              simpler "JS is just disabled" case specifically)
            - IntroOverlay's own mount effect, once React has hydrated and
              made the real decision (plays, or doesn't — covers
              prefers-reduced-motion too)
            suppressHydrationWarning covers the pre-hydration style
            mutations above (the inline script can run before the JS bundle
            that would hydrate this div has even loaded) — it tells React
            not to complain about *this element's own* attributes changing
            underneath it, which is exactly what it's for; it does not
            affect the always-the-same tree *shape* fix above, which is
            what actually stops the crash. */}
        <div
          id="intro-preboot"
          aria-hidden="true"
          suppressHydrationWarning
          style={{ position: "fixed", inset: 0, zIndex: 2147483647, background: "#020308", display: isHome ? undefined : "none" }}
        />
        <noscript>
          <style>{"#intro-preboot{display:none!important}"}</style>
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{function c(){var e=document.getElementById('intro-preboot');if(e)e.style.display='none';}if(location.hash){c();return;}setTimeout(c,5000);}catch(e){}})();",
          }}
        />
        <IntroPlayingProvider>
          <NightSky />
          <TopNav />
          <main className="relative z-[2]">{children}</main>
          <Footer />
        </IntroPlayingProvider>
      </body>
    </html>
  );
}
