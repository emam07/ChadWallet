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

interface Holder {
  address: string;
  amount: number;
  percentage: number;
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

function generateHolders(address: string): Holder[] {
  const seed = parseInt(address.slice(0, 6), 16);
  const prefixes = ["7xKp", "9aLm", "BcZn", "Dw4R", "Fg8S", "HjT2", "Km6V", "Np3Y", "Pq1X", "Rst5"];
  const suffixes = ["3Rft", "Wq2x", "8Yh1", "5Tpj", "Lk7n", "9Qwe", "Xt4b", "2Cvs", "4Mno", "7Uvw"];
  const holders = [];
  let remaining = 100;

  for (let i = 0; i < 10; i++) {
    const pct = i === 0
      ? 8 + ((seed % 7))
      : i === 1
      ? 4 + ((seed % 5))
      : Math.max(0.1, (remaining / (10 - i)) * (0.5 + Math.random()));
    const capped = Math.min(pct, remaining);
    remaining -= capped;

    holders.push({
      address: `${prefixes[i % prefixes.length]}...${suffixes[(i + seed) % suffixes.length]}`,
      amount: capped * 1_000_000,
      percentage: capped,
    });
  }

  return holders.sort((a, b) => b.percentage - a.percentage);
}

export function TradesFeed({ address }: { address: string }) {
  const [tab, setTab] = useState<"trades" | "holders">("trades");
  const { data } = useSWR(`/api/trades/${address}`, fetcher, {
    refreshInterval: 5000,
  });

  const trades: Trade[] = data?.trades ?? [];
  const holders = generateHolders(address);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
        <button
          onClick={() => setTab("trades")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            tab === "trades"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          Live Trades
        </button>
        <button
          onClick={() => setTab("holders")}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            tab === "holders"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          <Users className="w-3 h-3" />
          Holders
        </button>
        {tab === "trades" && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Trades header */}
      {tab === "trades" && (
        <>
          <div className="grid grid-cols-5 px-4 py-1.5 text-[10px] text-white/25 font-medium border-b border-white/[0.04]">
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
                className="grid grid-cols-5 items-center px-4 py-2 text-xs border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
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
                <span className="text-right font-mono text-white/70">
                  {formatPrice(trade.price)}
                </span>
                <span className="text-right font-mono text-white/50 text-[11px]">
                  {formatAmount(trade.amount)}
                </span>
                <span className="text-right font-mono text-white/60">
                  ${formatAmount(trade.value)}
                </span>
                <span className="text-right text-white/30">
                  {timeAgo(trade.timestamp)}
                </span>
              </div>
            ))}

            {trades.length === 0 && (
              <div className="flex items-center justify-center h-32 text-white/30 text-sm">
                Waiting for trades...
              </div>
            )}
          </div>
        </>
      )}

      {/* Holders */}
      {tab === "holders" && (
        <>
          <div className="grid grid-cols-3 px-4 py-1.5 text-[10px] text-white/25 font-medium border-b border-white/[0.04]">
            <span>Wallet</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Share</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {holders.map((h, i) => (
              <div
                key={h.address}
                className="grid grid-cols-3 items-center px-4 py-2.5 text-xs border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 text-[10px] text-white/25">{i + 1}</span>
                  <span className="font-mono text-white/60">{h.address}</span>
                </div>
                <span className="text-right font-mono text-white/50">
                  {formatAmount(h.amount)}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-green/60"
                      style={{ width: `${Math.min(100, h.percentage * 8)}%` }}
                    />
                  </div>
                  <span className="font-mono text-white/60 w-10 text-right">
                    {h.percentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
