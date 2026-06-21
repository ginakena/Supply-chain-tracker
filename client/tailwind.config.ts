import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EFE9DD",
        "paper-card": "#FAF7EF",
        ink: "#1B2430",
        "ink-soft": "#4A5568",
        rule: "#C9BFA8",
        stamp: {
          rust: "#B23A2E",
          green: "#2F6F62",
          amber: "#B8862B",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(circle at 1px 1px, rgba(27,36,48,0.04) 1px, transparent 0)",
      },
      backgroundSize: {
        grain: "16px 16px",
      },
    },
  },
  plugins: [],
};

export default config;
