import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a1a2e",
        surface: "#16213e",
        "surface-2": "#0f172a",
        "surface-hover": "#1e3a5f",
        border: "#2d3748",
        "border-subtle": "#1e2a3a",
        // Brokerage colors
        stash: { bg: "#1d4ed8", text: "#93c5fd" },
        robinhood: { bg: "#065f46", text: "#6ee7b7" },
        sofi: { bg: "#6b21a8", text: "#d8b4fe" },
        acorns: { bg: "#92400e", text: "#fcd34d" },
        // Action colors
        buy: "#22c55e",
        sell: "#ef4444",
        hold: "#eab308",
        // Health colors
        strong: "#22c55e",
        moderate: "#eab308",
        weak: "#ef4444",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
