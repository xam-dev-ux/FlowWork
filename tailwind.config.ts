import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#06b6d4", // cyan-500
        secondary: "#8b5cf6", // violet-500
        success: "#10b981", // emerald-500
        danger: "#ef4444", // red-500
        dark: "#0a0a0f",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        glow: {
          from: { boxShadow: "0 0 5px #06b6d4, 0 0 10px #06b6d4" },
          to: { boxShadow: "0 0 10px #06b6d4, 0 0 20px #06b6d4, 0 0 30px #06b6d4" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
