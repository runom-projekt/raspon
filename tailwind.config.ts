import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "#f6f6f7",
          100: "#e8e9eb",
          200: "#d1d3d7",
          300: "#aeb1b8",
          400: "#848792",
          500: "#666a76",
          600: "#54565f",
          700: "#45464e",
          800: "#2d2e33",
          900: "#1c1c1f",
          950: "#0d0d0f",
        },
        accent: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#ffc9aa",
          300: "#ffa374",
          400: "#ff7c3c",
          500: "#ff5a1f",
          600: "#f03e0a",
          700: "#c72c09",
          800: "#9e250f",
          900: "#7f2210",
          950: "#450e05",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(15, 15, 17, 0.06)",
        card: "0 8px 30px rgba(15, 15, 17, 0.08)",
        premium: "0 20px 60px -10px rgba(15, 15, 17, 0.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
