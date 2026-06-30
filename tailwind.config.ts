import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          green: "#16a34a",
          teal: "#06b6d4",
          purple: "#8b5cf6",
          indigo: "#5b5bd6",
          // Chad Wallet brand gold — retained for completeness, but on the new
          // light theme the active/brand accent is indigo (see globals.css).
          gold: "#5b5bd6",
        },
        // Primary foreground/dark token. Used (with opacity modifiers) for text,
        // borders and subtle surfaces across the light theme: text-ink,
        // text-ink/60, border-ink/[0.08], bg-ink/[0.04], etc.
        ink: "#0e1116",
        bg: {
          primary: "#f4f5f7",
          secondary: "#ffffff",
          card: "#ffffff",
          border: "rgba(14,17,22,0.08)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(14,17,22,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(14,17,22,0.045) 1px, transparent 1px)",
        "glow-green":
          "radial-gradient(ellipse at center, rgba(34,197,94,0.15) 0%, transparent 70%)",
        "glow-purple":
          "radial-gradient(ellipse at center, rgba(91,91,214,0.15) 0%, transparent 70%)",
        "accent-gradient":
          "linear-gradient(90deg, #22c55e 0%, #06b6d4 50%, #8b5cf6 100%)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(91,91,214,0.12) 0%, transparent 60%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "float-medium": "float 6s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        ticker: "ticker 30s linear infinite",
        "ticker-reverse": "tickerReverse 35s linear infinite",
        "spin-slow": "spin 20s linear infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        "count-flash": "countFlash 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        tickerReverse: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        countFlash: {
          "0%": { color: "#00FFA3" },
          "100%": { color: "inherit" },
        },
      },
      boxShadow: {
        "glow-green": "0 10px 30px rgba(22,163,74,0.18)",
        "glow-purple": "0 10px 30px rgba(91,91,214,0.18)",
        "glow-indigo": "0 10px 30px rgba(91,91,214,0.22)",
        card: "0 1px 2px rgba(14,17,22,0.04), 0 4px 16px rgba(14,17,22,0.04)",
        "card-hover": "0 18px 50px rgba(14,17,22,0.10), 0 0 0 1px rgba(14,17,22,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
