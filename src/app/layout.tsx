import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TopNav from "@/components/TopNav";
import NightSky from "@/components/night-sky/NightSky";

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

const marcellus = localFont({
  src: [{ path: "../fonts/marcellus/Marcellus-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});

const kaiseiDecol = localFont({
  src: [
    { path: "../fonts/kaisei-decol/KaiseiDecol-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/kaisei-decol/KaiseiDecol-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-label",
  display: "swap",
});

export const metadata: Metadata = {
  title: "藤田都 — Portfolio",
  description: "北陸先端科学技術大学院大学 修士1年 藤田都のポートフォリオ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${zenOldMincho.variable} ${zenKaku.variable} ${marcellus.variable} ${kaiseiDecol.variable}`}>
      <body className="font-sans">
        <NightSky />
        <TopNav />
        <main className="relative z-[2]">{children}</main>
      </body>
    </html>
  );
}
