/**
 * Tailwind 主题扩展（主色 #165DFF、辅助色 #36D399）
 * 与 src/index.css 中 @theme 保持一致
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#165DFF",
        accent: "#36D399",
        surface: "#F9FAFB",
        "surface-dark": "#111827",
      },
      fontFamily: {
        sans: ["'PingFang SC'", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(22, 93, 255, 0.08)",
        "card-hover": "0 8px 32px rgba(22, 93, 255, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "float-up": "floatUp 0.3s ease-out",
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
        floatUp: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
