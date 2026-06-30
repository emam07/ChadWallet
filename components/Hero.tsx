"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

const APP_STORE_URL = "https://apps.apple.com/us/app/chadwallet/id6757367474";

// Default token the "Start trading" CTA opens once the user is signed in (SOL).
const DEFAULT_TRADE_TOKEN = "So11111111111111111111111111111111111111112";

// Stagger entrance (replaces the GSAP timeline in the spec with framer-motion,
// already a project dependency — same effect: each element fades/rises in turn).
const fade = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Hero() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const [pendingTrade, setPendingTrade] = useState(false);

  // "Start trading" → sign in (if needed), then route to the trade dashboard.
  const goTrade = useCallback(() => {
    router.push(`/trade/${DEFAULT_TRADE_TOKEN}`);
  }, [router]);

  const handleStartTrading = useCallback(() => {
    if (authenticated) {
      goTrade();
      return;
    }
    setPendingTrade(true);
    if (ready) login();
  }, [authenticated, ready, login, goTrade]);

  useEffect(() => {
    if (pendingTrade && authenticated) {
      setPendingTrade(false);
      goTrade();
    }
  }, [pendingTrade, authenticated, goTrade]);

  return (
    <section className="hero">
      {/* Full-bleed background photo (public/backgroudimage.jpg) + a darkening
          overlay so the headline stays legible. The photo already carries the
          starfield / moon / astronaut, so the CSS-generated scene was removed. */}
      <div className="hero-bg" />
      <div className="hero-overlay" />

      <div className="hero-content">
        <motion.h1 custom={0} variants={fade} initial="hidden" animate="show">
          chad wallet
        </motion.h1>
        <motion.p className="hero-sub-bold" custom={1} variants={fade} initial="hidden" animate="show">
          where degens become legends.
        </motion.p>
        <motion.p className="hero-sub-light" custom={2} variants={fade} initial="hidden" animate="show">
          From memecoins to viral tokens, trade any Solana token in seconds.
        </motion.p>
        <motion.div className="hero-ctas" custom={3} variants={fade} initial="hidden" animate="show">
          <button
            className="btn-primary"
            onClick={handleStartTrading}
            aria-busy={pendingTrade && !authenticated}
          >
            {pendingTrade && !authenticated ? "Opening sign in…" : "Start trading"}
          </button>
          <a className="btn-secondary" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            Download app
          </a>
        </motion.div>
      </div>
    </section>
  );
}
