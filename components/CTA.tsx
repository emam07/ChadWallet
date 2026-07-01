"use client";

import Reveal from "@/components/Reveal";
import { useLoginAndTrade } from "@/hooks/useLoginAndTrade";

const APP_STORE_URL = "https://apps.apple.com/us/app/chadwallet/id6757367474";

export default function CTA() {
  // Same shared login → trade flow as the Navbar and Hero buttons; redirects
  // into the dashboard reliably, including after a full-page OAuth redirect.
  const { authenticated, pending, start: launch } = useLoginAndTrade();

  return (
    <Reveal as="section" className="cta-section">
      <h2>ChadWallet</h2>
      <p>Start Trading Before Everyone Else.</p>
      <div className="hero-ctas">
        <button className="btn-primary" onClick={launch} aria-busy={pending && !authenticated}>
          {pending && !authenticated ? "Opening sign in…" : "Launch App"}
        </button>
        <a className="btn-secondary" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          Download App
        </a>
      </div>
    </Reveal>
  );
}
