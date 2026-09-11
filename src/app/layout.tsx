import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

const shippori = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-shippori",
});

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen-kaku",
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
    <html lang="ja" className={`${shippori.variable} ${zenKaku.variable}`}>
      <body className="font-sans">
        <div className="sky-fixed" aria-hidden="true" />
        <SiteNav />
        <main className="relative z-[2]">{children}</main>
      </body>
    </html>
  );
}
