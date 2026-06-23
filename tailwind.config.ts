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
          green: "#00FFA3",
          purple: "#6B5CFF",
        },
        bg: {
          primary: "#030305",
          secondary: "#0A0A0F",
          card: "#0D0D15",
          border: "rgba(255,255,255,0.06)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,255,163,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.03) 1px, transparent 1px)",
        "glow-green":
          "radial-gradient(ellipse at center, rgba(0,255,163,0.15) 0%, transparent 70%)",
        "glow-purple":
          "radial-gradient(ellipse at center, rgba(107,92,255,0.15) 0%, transparent 70%)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,255,163,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(107,92,255,0.10) 0%, transparent 60%)",
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
        "glow-green": "0 0 40px rgba(0,255,163,0.15)",
        "glow-purple": "0 0 40px rgba(107,92,255,0.15)",
        "card-hover": "0 20px 60px rgba(0,255,163,0.08), 0 0 0 1px rgba(0,255,163,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
