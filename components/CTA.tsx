"use client";

import Reveal from "@/components/Reveal";
import { useLoginAndTrade } from "@/hooks/useLoginAndTrade";

const DOCS_URL = "https://play.google.com/store/apps/details?id=xyz.chadwallet.www";

export default function CTA() {
  // Same shared login → trade flow as the Navbar and Hero buttons; redirects
  // into the dashboard reliably, including after a full-page OAuth redirect.
  const { authenticated, pending, start: launch } = useLoginAndTrade();

  return (
    <Reveal as="section" className="cta-section">
      <h2>chad wallet</h2>
      <p>Start trading before everyone else.</p>
      <div className="hero-ctas">
        <button className="btn-primary" onClick={launch} aria-busy={pending && !authenticated}>
          {pending && !authenticated ? "Opening sign in…" : "Launch App"}
        </button>
        <a className="btn-secondary" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
          Read Docs
        </a>
      </div>
    </Reveal>
  );
}
