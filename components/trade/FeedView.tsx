"use client";

import useSWR from "swr";
import { ArrowUpRight, ArrowDownRight, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (delta < 60) return `${Math.floor(delta)}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return `${Math.floor(delta / 3600)}h ago`;
}

function walletColor(wallet: string) {
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) hash = wallet.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 70% 55%)`;
}

// Live activity feed for the currently-open token — real swaps streamed from
// BirdEye via /api/trades. (A cross-token global feed would need a firehose the
// market-data tier doesn't expose, so this stays honest: the token you're on.)
export function FeedView({ address, symbol }: { address: string; symbol: string }) {
  const { data } = useSWR(`/api/trades/${address}`, fetcher, { refreshInterval: 5000 });
  const trades: Trade[] = data?.trades ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Rss className="w-5 h-5 text-[#16c784]" />
        <h1 className="text-lg font-bold text-white">Live Feed</h1>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-[#16c784]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16c784] animate-pulse" />
          Live
        </span>
      </div>
      <p className="text-xs text-white/40 mb-5">
        Latest swaps hitting the tape for <span className="text-white/70 font-semibold">{symbol}</span>.
      </p>

      {trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Rss className="w-6 h-6 text-white/20 mb-3" />
          <p className="text-sm text-white/50">Waiting for trades…</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {trades.map((t, i) => {
            const buy = t.type === "buy";
            return (
              <div
                key={`${t.txHash}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <span
                  className="w-7 h-7 rounded-full shrink-0"
                  style={{ background: walletColor(t.wallet) }}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {buy ? (
                    <ArrowUpRight className="w-4 h-4 text-[#16c784]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-[#f6465d]" />
                  )}
                  <span className={cn("text-xs font-bold", buy ? "text-[#16c784]" : "text-[#f6465d]")}>
                    {buy ? "BUY" : "SELL"}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-white/50 truncate">{t.wallet}</span>
                <div className="ml-auto flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono text-white/60">
                    {formatAmount(t.amount)} {symbol}
                  </span>
                  <span className="text-xs font-mono text-white/70 w-20 text-right">
                    ${formatAmount(t.value)}
                  </span>
                  <span className="text-xs font-mono text-white/40 w-16 text-right hidden sm:block">
                    {formatPrice(t.price)}
                  </span>
                  <span className="text-[11px] text-white/30 w-14 text-right">{timeAgo(t.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
