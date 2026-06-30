"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Trade {
  txHash: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
  value: number;
  wallet: string;
  timestamp: number;
}

function formatPrice(price: number) {
  if (!price) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(9)}`;
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatAmount(n: number | null | undefined) {
  if (n == null || isNaN(n)) return "0.00";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function timeAgo(ts: number) {
  const delta = (Date.now() - ts) / 1000;
  if (delta < 60) return `${Math.floor(delta)}s`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m`;
  return `${Math.floor(delta / 3600)}h`;
}

// Deterministic avatar tint from a wallet string (no external avatar service).
function walletColor(wallet: string) {
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) hash = wallet.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 55%)`;
}

export function TradesFeed({ address }: { address: string }) {
  // Holders first per the Chad Wallet layout; "Swaps" replaces "Live Trades".
  const [tab, setTab] = useState<"holders" | "swaps">("swaps");
  const { data } = useSWR(`/api/trades/${address}`, fetcher, {
    refreshInterval: 5000,
  });

  const trades: Trade[] = data?.trades ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ink/[0.06]">
        <button
          onClick={() => setTab("holders")}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            tab === "holders"
              ? "bg-ink/10 text-ink"
              : "text-ink/40 hover:text-ink/70"
          )}
        >
          <Users className="w-3 h-3" />
          Holders
        </button>
        <button
          onClick={() => setTab("swaps")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            tab === "swaps"
              ? "bg-accent-indigo/15 text-accent-indigo"
              : "text-ink/40 hover:text-ink/70"
          )}
        >
          Swaps
        </button>
        {tab === "swaps" && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Swaps table */}
      {tab === "swaps" && (
        <>
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_0.6fr] px-4 py-1.5 text-[10px] text-ink/25 font-medium border-b border-ink/[0.04]">
            <span>Trader</span>
            <span>Type</span>
            <span className="text-right">Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Value</span>
            <span className="text-right">Age</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {trades.map((trade, i) => (
              <div
                key={`${trade.txHash}-${i}`}
                className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_0.6fr] items-center px-4 py-2 text-xs border-b border-ink/[0.03] hover:bg-ink/[0.02] transition-colors"
              >
                {/* Trader avatar + truncated wallet */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ background: walletColor(trade.wallet) }}
                  />
                  <span className="font-mono text-[11px] text-ink/50 truncate">
                    {trade.wallet}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {trade.type === "buy" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-accent-green" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span
                    className={cn(
                      "font-semibold text-[11px]",
                      trade.type === "buy" ? "text-accent-green" : "text-red-400"
                    )}
                  >
                    {trade.type === "buy" ? "BUY" : "SELL"}
                  </span>
                </div>
                <span className="text-right font-mono text-ink/70">
                  {formatPrice(trade.price)}
                </span>
                <span className="text-right font-mono text-ink/50 text-[11px]">
                  {formatAmount(trade.amount)}
                </span>
                <span className="text-right font-mono text-ink/60">
                  ${formatAmount(trade.value)}
                </span>
                <span className="text-right text-ink/30">
                  {timeAgo(trade.timestamp)}
                </span>
              </div>
            ))}

            {trades.length === 0 && (
              <div className="flex items-center justify-center h-32 text-ink/30 text-sm">
                Waiting for trades...
              </div>
            )}
          </div>
        </>
      )}

      {/* Holders — BirdEye's market-data tier exposes a holder count but not the
          full holder distribution, so we show an honest unavailable state rather
          than fabricating wallets and percentages. */}
      {tab === "holders" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Users className="w-6 h-6 text-ink/20 mb-3" />
          <p className="text-sm text-ink/50">Holder data not available</p>
          <p className="text-[11px] text-ink/30 mt-1.5 max-w-[240px]">
            The current market data tier doesn&apos;t expose holder
            distributions. This tab activates once a holder-aware data source
            (e.g. an indexed RPC) is connected.
          </p>
        </div>
      )}
    </div>
  );
}
