import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          deep: "#050b14",
          mid: "#0b2129",
          teal: "#123138",
        },
        panel: "rgba(11, 22, 30, 0.62)",
        // ink.soft/faintは元々G>Bの緑がかったグレーだったため、青テーマに
        // 合わせてB>Gの青みがかったグレーへ調整(明度はほぼ維持)
        ink: {
          DEFAULT: "#eef1f4",
          soft: "#9fabc4",
          faint: "#6c7c91",
        },
        accent: {
          // 参考画像(草花に光が当たって最も明るく見える部分)から直接サンプ
          // リングした青
          teal: "#9ED4FF",
          blue: "#5ea0ff",
          moon: "#cdeedd",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)", "serif"],
        sans: ["var(--font-zen-kaku)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        label: ["var(--font-label)", "serif"],
        intro: ["var(--font-intro)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
