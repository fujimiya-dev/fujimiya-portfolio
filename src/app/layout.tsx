import type { Metadata } from "next";
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
      ? "Portfolio of Miyako Fujita, 1st-year Master's student at Japan Advanced Institute of Science and Technology (JAIST)"
      : "北陸先端科学技術大学院大学 修士1年 藤田都のポートフォリオ";

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

  return (
    <html
      lang={locale}
      className={`${zenOldMincho.variable} ${zenKaku.variable} ${hinaMincho.variable} ${hinaMinchoLabel.variable} ${nothingYouCouldDo.variable}`}
    >
      <body className="grid min-h-screen grid-rows-[1fr_auto] font-sans">
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
