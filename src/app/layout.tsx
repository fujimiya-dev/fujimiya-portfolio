import type { Metadata } from "next";
import { Zen_Old_Mincho, Zen_Kaku_Gothic_New, Marcellus, Kaisei_Decol } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import NightSky from "@/components/night-sky/NightSky";

const zenOldMincho = Zen_Old_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-heading",
});

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen-kaku",
});

const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const kaiseiDecol = Kaisei_Decol({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-label",
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
