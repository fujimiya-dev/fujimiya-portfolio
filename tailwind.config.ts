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
        ink: {
          DEFAULT: "#eef4f1",
          soft: "#9fb6b2",
          faint: "#6c837f",
        },
        accent: {
          // GrassFieldのPETAL_COLOR(光が当たって最も明るく見える草の青)に統一
          teal: "#7FB7FF",
          blue: "#5ea0ff",
          moon: "#cdeedd",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)", "serif"],
        sans: ["var(--font-zen-kaku)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
