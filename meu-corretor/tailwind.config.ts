import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          yellow:  { DEFAULT: "#C8860A", light: "#F0A830", dark: "#96640A" },
          green:   { DEFAULT: "#2D6A4F", light: "#40916C", dark: "#1B4332" },
          orange:  { DEFAULT: "#E07B39", light: "#F4A261", dark: "#B85C1E" },
          purple:  { DEFAULT: "#6B4FA0", light: "#9B72CF", dark: "#4A2F7A" },
        },
        beige: {
          50:  "#FBF7EF",
          100: "#F5ECD7",
          200: "#EDD9B5",
          300: "#E0C28A",
        },
        dark: {
          bg:      "#0F0F1A",
          surface: "#1A1A2E",
          card:    "#242438",
          border:  "#2E2E4A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(0,0,0,0.08)",
        "card-dark": "0 4px 24px 0 rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
