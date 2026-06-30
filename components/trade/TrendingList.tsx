"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { TrendingUp, TrendingDown, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokens as mockTokens } from "@/lib/data";

const PAGE_SIZE = 15;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Sub-tabs above the list. Each is a real, data-backed filter/sort over the
// live token list (no fabricated "most held / graduating" tiers — those need
// holder/bonding-curve data the market-data API doesn't expose).
type SubTab = "trending" | "gainers" | "crypto" | "watchlist";
const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "watchlist", label: "Watchlist" },
  { id: "crypto", label: "Crypto" },
  { id: "trending", label: "Trending" },
  { id: "gainers", label: "Gainers" },
];

// Symbols that count as "Crypto" (established majors) vs memecoins.
const CRYPTO_SYMBOLS = new Set([
  "SOL", "JUP", "PYTH", "JTO", "RAY", "RENDER", "ORCA", "GRASS",
]);

const WATCHLIST_KEY = "chadwallet:watchlist";

interface TokenItem {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
  marketCap?: number;
  color?: string;
  logoURI?: string;
}

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

// localStorage-backed watchlist (real, persists across sessions).
function useWatchlist() {
  const [set, setSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      if (raw) setSet(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const toggle = useCallback((address: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  return { set, toggle };
}

export function TrendingList({
  currentAddress,
  query = "",
}: {
  currentAddress: string;
  /** Search query — owned by the page navbar so the search bar can live in the
   *  top-center of the layout rather than inside this sidebar. */
  query?: string;
}) {
  const [page, setPage] = useState(0);
  const [subTab, setSubTab] = useState<SubTab>("trending");
  const { set: watchlist, toggle: toggleWatch } = useWatchlist();
  const { data } = useSWR("/api/tokens", fetcher, { refreshInterval: 30000 });
  const allTokens: TokenItem[] = data?.tokens ?? mockTokens;

  // Apply the active sub-tab filter/sort.
  const tabbed: TokenItem[] = (() => {
    switch (subTab) {
      case "watchlist":
        return allTokens.filter((t) => watchlist.has(t.address));
      case "crypto":
        return allTokens.filter((t) => CRYPTO_SYMBOLS.has(t.symbol.toUpperCase()));
      case "gainers":
        return [...allTokens].sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
      case "trending":
      default:
        return allTokens;
    }
  })();

  const filtered = query
    ? tabbed.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase())
      )
    : tabbed;

  // Paginate 15 per page (the last page may hold fewer). Clamp the active page
  // so it stays valid as the live list / search results change size underneath.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageTokens = filtered.slice(start, start + PAGE_SIZE);

  // Reset to the first page whenever the (externally-owned) search query changes.
  useEffect(() => {
    setPage(0);
  }, [query]);

  const onTab = (id: SubTab) => {
    setSubTab(id);
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header: sub-tabs (search now lives in the page's top-center navbar) */}
      <div className="px-4 pt-4 pb-2 border-b border-ink/[0.06]">
        <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 scrollbar-none">
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={cn(
                "shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all whitespace-nowrap",
                subTab === t.id
                  ? "text-accent-indigo bg-accent-indigo/10 border border-accent-indigo/30"
                  : "text-ink/40 hover:text-ink/70 border border-transparent"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {pageTokens.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-ink/30">
            {subTab === "watchlist"
              ? "No tokens watched yet — tap the ☆ on any token to add it."
              : "No tokens found"}
          </div>
        )}
        {pageTokens.map((token, i) => {
          const rank = start + i;
          const isActive = token.address === currentAddress;
          const isPositive = (token.change ?? 0) >= 0;
          const watched = watchlist.has(token.address);

          return (
            <a
              key={`${token.address ?? ""}-${rank}`}
              href={`/trade/${token.address}`}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.04] transition-colors border-b border-ink/[0.03] cursor-pointer",
                isActive && "bg-accent-indigo/[0.06] border-l-2 border-l-accent-indigo"
              )}
            >
              {/* Token logo (no rank circles) */}
              <div className="relative shrink-0">
                {token.logoURI ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `${token.color ?? "#f5c518"}20`,
                      color: token.color ?? "#f5c518",
                    }}
                  >
                    {token.symbol?.[0]}
                  </div>
                )}
              </div>

              {/* Identity + price (left), MC + change (right) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink truncate">
                    {token.symbol}
                  </span>
                  <span className="text-[11px] font-mono text-ink/70 shrink-0">
                    {formatNum(token.marketCap ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-[11px] text-ink/40 truncate">
                    {token.name} · {formatPrice(token.price)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold flex items-center gap-0.5 shrink-0",
                      isPositive ? "text-accent-green" : "text-red-400"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {(token.change ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Watchlist star */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWatch(token.address);
                }}
                className={cn(
                  "shrink-0 transition-colors",
                  watched
                    ? "text-accent-indigo"
                    : "text-ink/15 group-hover:text-ink/40 hover:!text-accent-indigo"
                )}
                title={watched ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Star className="w-3.5 h-3.5" fill={watched ? "currentColor" : "none"} />
              </button>
            </a>
          );
        })}
      </div>

      {/* Pagination — 15 per page, last page may hold fewer. */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-ink/[0.06] shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-ink/60 border border-ink/10 rounded-md hover:text-ink hover:border-ink/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-ink/60 disabled:hover:border-ink/10"
          >
            <ChevronLeft className="w-3 h-3" />
            Prev
          </button>
          <span className="text-[11px] font-mono text-ink/40">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-ink/60 border border-ink/10 rounded-md hover:text-ink hover:border-ink/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-ink/60 disabled:hover:border-ink/10"
          >
            Next
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
