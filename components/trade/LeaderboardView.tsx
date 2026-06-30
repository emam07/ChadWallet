"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokens as mockTokens } from "@/lib/data";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Row {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
  marketCap?: number;
  logoURI?: string;
  color?: string;
}

type SortKey = "volume" | "gainers" | "losers";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "volume", label: "Top Volume" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
];

function formatPrice(price: number) {
  if (!price) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(9)}`;
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatNum(n: number) {
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// Token leaderboard, ranked from the live /api/tokens feed (BirdEye trending).
// Real, data-backed — no fabricated trader rankings (we have no per-wallet data).
export function LeaderboardView() {
  const [sort, setSort] = useState<SortKey>("volume");
  const { data } = useSWR("/api/tokens", fetcher, { refreshInterval: 30000 });
  const tokens: Row[] = data?.tokens ?? mockTokens;

  const ranked = [...tokens].sort((a, b) => {
    if (sort === "gainers") return (b.change ?? 0) - (a.change ?? 0);
    if (sort === "losers") return (a.change ?? 0) - (b.change ?? 0);
    return (b.volume ?? 0) - (a.volume ?? 0);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-[#16c784]" />
        <h1 className="text-lg font-bold text-white">Token Leaderboard</h1>
      </div>
      <p className="text-xs text-white/40 mb-4">
        Live ranking of trending Solana tokens — tap any row to open its trade view.
      </p>

      {/* Sort toggles */}
      <div className="flex gap-1.5 mb-4">
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              sort === s.id
                ? "bg-[#16c784] text-black"
                : "bg-white/[0.05] text-white/55 hover:text-white hover:bg-white/[0.1]"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[40px_1.6fr_1fr_1fr_1fr_1fr] px-3 py-2 text-[10px] uppercase tracking-wide text-white/30 border-b border-white/[0.06]">
        <span>#</span>
        <span>Token</span>
        <span className="text-right">Price</span>
        <span className="text-right">24H</span>
        <span className="text-right">Volume</span>
        <span className="text-right">Market cap</span>
      </div>

      {/* Rows */}
      <div>
        {ranked.map((t, i) => {
          const positive = (t.change ?? 0) >= 0;
          return (
            <a
              key={`${t.address}-${i}`}
              href={`/trade/${t.address}`}
              className="grid grid-cols-[40px_1.6fr_1fr_1fr_1fr_1fr] items-center px-3 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-xs font-mono text-white/40">{i + 1}</span>
              <div className="flex items-center gap-2 min-w-0">
                {t.logoURI ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.logoURI}
                    alt={t.symbol}
                    className="w-7 h-7 rounded-full ring-1 ring-white/10 shrink-0"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ring-1 ring-white/10 shrink-0"
                    style={{ background: `${t.color ?? "#16c784"}20`, color: t.color ?? "#16c784" }}
                  >
                    {t.symbol?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{t.symbol}</div>
                  <div className="text-[10px] text-white/35 truncate">{t.name}</div>
                </div>
              </div>
              <span className="text-right text-xs font-mono text-white/70">{formatPrice(t.price)}</span>
              <span
                className={cn(
                  "text-right text-xs font-semibold font-mono flex items-center justify-end gap-0.5",
                  positive ? "text-[#16c784]" : "text-[#f6465d]"
                )}
              >
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {positive ? "+" : ""}
                {(t.change ?? 0).toFixed(2)}%
              </span>
              <span className="text-right text-xs font-mono text-white/55">{formatNum(t.volume)}</span>
              <span className="text-right text-xs font-mono text-white/55">{formatNum(t.marketCap ?? 0)}</span>
            </a>
          );
        })}
        {ranked.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-white/30">No tokens available</div>
        )}
      </div>
    </div>
  );
}
