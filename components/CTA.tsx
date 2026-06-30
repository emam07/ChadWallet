"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";

const DEFAULT_TRADE_TOKEN = "So11111111111111111111111111111111111111112";
const DOCS_URL = "https://play.google.com/store/apps/details?id=xyz.chadwallet.www";

export default function CTA() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const [pending, setPending] = useState(false);

  const goTrade = useCallback(() => {
    router.push(`/trade/${DEFAULT_TRADE_TOKEN}`);
  }, [router]);

  const launch = useCallback(() => {
    if (authenticated) {
      goTrade();
      return;
    }
    setPending(true);
    if (ready) login();
  }, [authenticated, ready, login, goTrade]);

  useEffect(() => {
    if (pending && authenticated) {
      setPending(false);
      goTrade();
    }
  }, [pending, authenticated, goTrade]);

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
