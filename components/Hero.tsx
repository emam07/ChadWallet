"use client";

import { motion } from "framer-motion";
import { useLoginAndTrade } from "@/hooks/useLoginAndTrade";

const APP_STORE_URL = "https://apps.apple.com/us/app/chadwallet/id6757367474";

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
  // "Start trading" → sign in (if needed), then route to the trade dashboard.
  // Shared hook survives the full-page OAuth redirect so the user always lands
  // on the dashboard rather than back on this page.
  const { authenticated, pending: pendingTrade, start: handleStartTrading } =
    useLoginAndTrade();

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
