import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ritual: {
          green: "#06503A", darkgreen: "#043D2C", light: "#F5F5F0",
          gold: "#C9A84C", dim: "#8A9E95", surface: "#0A1F18",
        },
      },
    },
  },
  plugins: [],
};
export default config;
