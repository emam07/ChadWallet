"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { tokens as mockTokens } from "@/lib/data";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TickerToken {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
  color: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatPrice(price: number) {
  if (price < 0.000001) return `$${price.toFixed(9)}`;
  if (price < 0.001) return `$${price.toFixed(7)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatVolume(volume: number) {
  if (volume >= 1_000_000_000) return `$${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(0)}M`;
  return `$${(volume / 1_000).toFixed(0)}K`;
}

function TickerItem({ token }: { token: TickerToken }) {
  const isPositive = token.change >= 0;
  return (
    <a
      href={`/trade/${token.address}`}
      className="group flex items-center gap-3 px-4 py-2 rounded-xl hover:glass hover:border-accent-green/10 border border-transparent transition-all duration-200 cursor-pointer shrink-0 mx-2"
      aria-label={`${token.symbol} price ${formatPrice(token.price)}`}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: `${token.color}20`, color: token.color }}
      >
        {token.symbol[0]}
      </div>
      <span className="font-mono text-xs font-bold text-white/90 group-hover:text-white transition-colors">
        {token.symbol}
      </span>
      <span className="font-mono text-xs text-white/50">{formatPrice(token.price)}</span>
      <span
        className={cn(
          "font-mono text-xs font-semibold flex items-center gap-0.5",
          isPositive ? "text-accent-green" : "text-red-400"
        )}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? "+" : ""}
        {token.change.toFixed(2)}%
      </span>
      <span className="font-mono text-[10px] text-white/25">
        {formatVolume(token.volume)}
      </span>
    </a>
  );
}

interface TokenTickerProps {
  reverse?: boolean;
}

export default function TokenTicker({ reverse = false }: TokenTickerProps) {
  const { data } = useSWR("/api/tokens", fetcher, { refreshInterval: 30000 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tokens: TickerToken[] = data?.tokens ?? mockTokens;
  const doubled = [...tokens, ...tokens];

  if (!mounted) return null;

  return (
    <div className="relative py-3 overflow-hidden border-y border-white/[0.04] bg-bg-secondary/30 ticker-container">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

      <div
        className={cn(
          "flex items-center whitespace-nowrap",
          reverse ? "animate-ticker-reverse" : "animate-ticker"
        )}
        aria-hidden="true"
      >
        {doubled.map((token, i) => (
          <TickerItem key={`${token.symbol}-${i}`} token={token} />
        ))}
      </div>
    </div>
  );
}
