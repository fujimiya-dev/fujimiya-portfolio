import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import NightSky from "@/components/night-sky/NightSky";
import { IntroPlayingProvider } from "@/components/IntroPlayingContext";

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

export const metadata: Metadata = {
  title: "Fujimiya",
  description: "北陸先端科学技術大学院大学 修士1年 藤田都のポートフォリオ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${zenOldMincho.variable} ${zenKaku.variable} ${hinaMincho.variable} ${hinaMinchoLabel.variable} ${nothingYouCouldDo.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <IntroPlayingProvider>
          <NightSky />
          <TopNav />
          <main className="relative z-[2] flex-1">{children}</main>
          <Footer />
        </IntroPlayingProvider>
      </body>
    </html>
  );
}
