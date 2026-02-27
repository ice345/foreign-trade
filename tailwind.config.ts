import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#05060a",
        panel: "#0d0f17",
        accent: "#6366f1",
        muted: "#9ca3af",
        border: "rgba(255, 255, 255, 0.12)",
        highlight: "#22d3ee"
      },
      boxShadow: {
        soft: "0 0 0 1px rgba(255,255,255,0.06), 0 16px 40px -20px rgba(15, 23, 42, 0.9)",
        glow: "0 0 30px rgba(99, 102, 241, 0.35)",
        halo: "0 0 60px rgba(34, 211, 238, 0.25)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
