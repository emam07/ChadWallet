"use client";

import { memo, useMemo, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

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
  owner: string;
  amount: number;
  percentage: number;
  rank: number;
}

// The holders route returns proper HTTP status codes (403 plan-gated, 429 rate
// limited, 502 network, …). This fetcher throws on non-2xx so SWR surfaces the
// failure via `error`, carrying the parsed { error, message } body so the UI can
// tell the states apart. (The swaps `fetcher` above never throws — swaps have a
// mock fallback, holders don't.)
interface HoldersError extends Error {
  status?: number;
  info?: { error?: string; message?: string };
}

async function holdersFetcher(url: string): Promise<{ holders: Holder[] }> {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      body?.message || "Failed to load holders"
    ) as HoldersError;
    err.status = res.status;
    err.info = body;
    throw err;
  }
  return body as { holders: Holder[] };
}

// Middle-truncate a Solana address for display, e.g. 7f2Xa...B91k.
function shortenAddress(a: string) {
  if (!a || a.length <= 9) return a || "unknown";
  return `${a.slice(0, 4)}...${a.slice(-4)}`;
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
  // Holders first per the reference layout; "Swaps" replaces "Live Trades".
  const [tab, setTab] = useState<"holders" | "swaps">("swaps");
  const { data } = useSWR(`/api/trades/${address}`, fetcher, {
    refreshInterval: 5000,
  });

  const trades: Trade[] = data?.trades ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
        <button
          onClick={() => setTab("holders")}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
            tab === "holders"
              ? "bg-white/[0.08] text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          <Users className="w-3 h-3" />
          Holders
        </button>
        <button
          onClick={() => setTab("swaps")}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
            tab === "swaps"
              ? "bg-white/[0.08] text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          Swaps
        </button>
        {tab === "swaps" && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-[#16c784]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16c784] animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Swaps table */}
      {tab === "swaps" && (
        <>
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_0.6fr] px-4 py-1.5 text-[10px] text-white/30 font-medium border-b border-white/[0.04]">
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
                className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr_0.6fr] items-center px-4 py-2 text-xs border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                {/* Trader avatar + truncated wallet */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ background: walletColor(trade.wallet) }}
                  />
                  <span className="font-mono text-[11px] text-white/50 truncate">
                    {trade.wallet}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {trade.type === "buy" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#16c784]" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#f6465d]" />
                  )}
                  <span
                    className={cn(
                      "font-semibold text-[11px]",
                      trade.type === "buy" ? "text-[#16c784]" : "text-[#f6465d]"
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

      {/* Holders — live top-holder distribution from BirdEye. Mounted only while
          the tab is active so its request fires on demand (and SWR serves the
          cached result instantly when the user switches back). */}
      {tab === "holders" && <HoldersPanel address={address} />}
    </div>
  );
}

// Isolated + memoized so the 5s swaps poll re-rendering the parent doesn't churn
// the holders subtree. Only rendered while the Holders tab is active, so the SWR
// request runs on demand rather than on mount of the trade page.
const HoldersPanel = memo(function HoldersPanel({ address }: { address: string }) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    { holders: Holder[] },
    HoldersError
  >(`/api/holders/${address}`, holdersFetcher, {
    revalidateOnFocus: false, // holder distribution is slow-moving
    dedupingInterval: 30_000, // dedupe rapid tab toggles
    shouldRetryOnError: false, // we offer an explicit Retry instead
    keepPreviousData: true,
  });

  const holders = useMemo(() => data?.holders ?? [], [data]);

  // Loading skeletons (first load only — keepPreviousData covers revalidations).
  if (isLoading && !data) {
    return (
      <div className="flex-1 overflow-hidden" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading holders…</span>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.03]"
          >
            <div className="w-4 h-3 rounded bg-white/[0.06] animate-pulse" />
            <div className="w-5 h-5 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
            <div className="h-3 flex-1 max-w-[120px] rounded bg-white/[0.06] animate-pulse" />
            <div className="ml-auto h-3 w-14 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Error / unavailable states. Transient failures (rate limited, network) get a
  // Retry button; plan/feature limits don't (retrying won't help).
  if (error) {
    const code = error.info?.error;
    const transient = code === "rate_limited" || code === "network_error";
    const message =
      error.info?.message || "Something went wrong loading holders.";
    return (
      <div
        role="alert"
        className="flex-1 flex flex-col items-center justify-center px-6 text-center"
      >
        <AlertTriangle className="w-6 h-6 text-white/20 mb-3" />
        <p className="text-sm text-white/50 max-w-[260px]">{message}</p>
        {transient && (
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.1] transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isValidating && "animate-spin")}
            />
            {isValidating ? "Retrying…" : "Retry"}
          </button>
        )}
      </div>
    );
  }

  // Genuine empty state — BirdEye returned zero holders.
  if (holders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Users className="w-6 h-6 text-white/20 mb-3" />
        <p className="text-sm text-white/50">No holders found for this token.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" aria-busy={isValidating}>
      <table className="w-full text-xs border-collapse">
        <caption className="sr-only">Top token holders</caption>
        <thead className="sticky top-0 z-10 bg-[#0a0b0e]">
          <tr className="text-[10px] text-white/30 border-b border-white/[0.04]">
            <th scope="col" className="w-10 text-left font-medium px-4 py-1.5">
              #
            </th>
            <th scope="col" className="text-left font-medium py-1.5">
              Wallet
            </th>
            <th scope="col" className="text-right font-medium py-1.5">
              Amount
            </th>
            <th scope="col" className="text-right font-medium px-4 py-1.5">
              Ownership
            </th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h) => {
            const wallet = h.owner || h.address;
            return (
              <tr
                key={wallet}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-2 text-white/30 tabular-nums">
                  {h.rank}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full shrink-0"
                      style={{ background: walletColor(wallet) }}
                    />
                    <span
                      className="font-mono text-[11px] text-white/50 truncate"
                      title={wallet}
                    >
                      {shortenAddress(wallet)}
                    </span>
                  </div>
                </td>
                <td className="text-right font-mono text-white/60 py-2">
                  {formatAmount(h.amount)}
                </td>
                <td className="text-right font-mono text-white/70 px-4 py-2 tabular-nums">
                  {h.percentage > 0 ? `${h.percentage.toFixed(2)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
