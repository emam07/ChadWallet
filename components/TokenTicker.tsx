"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { tokens as mockTokens, type Token } from "@/lib/data";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatPrice(price: number) {
  if (price < 0.000001) return `$${price.toFixed(9)}`;
  if (price < 0.001) return `$${price.toFixed(7)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/**
 * Live ticker strip (section 3). Pulls top Solana tokens from /api/tokens
 * (BirdEye trending → mock fallback) on mount and re-polls every 15s so the
 * prices stay close to real time, then scrolls them in a seamless marquee. The
 * token list is duplicated so the -50% keyframe loops without a visible seam.
 *
 * Each token is clickable: signed-out users are sent through the Privy login
 * first, signed-in users go straight to that token's trade page. Prices are
 * pulled live from the backend and coloured green/red.
 */
export default function TokenTicker() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();

  const { data } = useSWR<{ tokens?: Token[] }>("/api/tokens", fetcher, {
    refreshInterval: 15000,
    keepPreviousData: true,
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Remember which token the user clicked while signed out, then route there
  // once Privy reports them authenticated.
  const pendingAddress = useRef<string | null>(null);

  const handleTokenClick = useCallback(
    (address: string) => {
      if (authenticated) {
        router.push(`/trade/${address}`);
        return;
      }
      pendingAddress.current = address;
      if (ready) login();
    },
    [authenticated, ready, login, router]
  );

  useEffect(() => {
    if (authenticated && pendingAddress.current) {
      const address = pendingAddress.current;
      pendingAddress.current = null;
      router.push(`/trade/${address}`);
    }
  }, [authenticated, router]);

  if (!mounted) return null;

  const tokens: Token[] = data?.tokens?.length ? data.tokens : mockTokens;
  const doubled = [...tokens, ...tokens];

  return (
    <div className="ticker-strip" aria-label="Live token prices">
      <div className="ticker-inner">
        {doubled.map((t, i) => {
          const up = t.change >= 0;
          const isClone = i >= tokens.length;
          return (
            <button
              type="button"
              className="ticker-item"
              key={`${t.symbol}-${i}`}
              aria-hidden={isClone}
              tabIndex={isClone ? -1 : 0}
              onClick={() => handleTokenClick(t.address)}
              title={`Trade ${t.symbol}`}
            >
              <b>{t.symbol}</b>
              <span className={up ? "ticker-up" : "ticker-down"}>
                {up ? "+" : ""}
                {t.change.toFixed(1)}%
              </span>
              {formatPrice(t.price)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
