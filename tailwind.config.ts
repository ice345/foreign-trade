import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        panel: "var(--surface)",
        accent: "var(--accent)",
        muted: "var(--text-secondary)",
        border: "var(--border)",
        highlight: "var(--info)"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-elevated)",
        halo: "var(--shadow-elevated)"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Inter",
          "PingFang SC",
          "Noto Sans SC",
          "Microsoft YaHei",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
} satisfies Config;
