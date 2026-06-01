/**
 * Tailwind 主题扩展 — 与 design-system/智慧学习中心/MASTER.md 对齐
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#818CF8",
        accent: "#22C55E",
        surface: "#EEF2FF",
        "surface-dark": "#1E1B4B",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans SC"', "PingFang SC", "sans-serif"],
      },
      boxShadow: {
        clay: "0 1px 0 rgba(255,255,255,0.95) inset, 0 6px 0 rgba(79,70,229,0.06), 0 12px 24px rgba(79,70,229,0.08)",
        "clay-hover":
          "0 1px 0 rgba(255,255,255,0.95) inset, 0 8px 0 rgba(79,70,229,0.08), 0 16px 32px rgba(79,70,229,0.12)",
      },
      borderRadius: {
        clay: "1rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
