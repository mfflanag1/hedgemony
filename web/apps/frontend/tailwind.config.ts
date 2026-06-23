import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Faction accents
        openbrain: "#00bfff",
        deepcent: "#ff1744",
        hegemon: "#ffd700",
        politburo: "#ff00ff",
        cartel: "#39ff14",
        coalition: "#ff9500",
        successor: "#e0e0e0",
        // Background tiers
        bg: {
          base: "#0a0e27",
          panel: "#111530",
          card: "#1a1f3d",
          line: "#252a4a",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
