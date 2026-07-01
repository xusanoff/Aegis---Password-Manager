import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0B10",
        elev: "#0E1016",
        panel: "#14161D",
        panel2: "#181B22",
        line: "rgba(255,255,255,0.08)",
        line2: "rgba(255,255,255,0.12)",
        ink: "#EDEEF2",
        dim: "#9BA1AD",
        faint: "#6B7180",
        accent: "#7C5CFF",
        accentHover: "#8B6DFF",
        accentDim: "#2A2340",
        accentInk: "#B9A9FF",
        strong: "#4FD6A0",
        fair: "#E5A94F",
        weak: "#E5674F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
