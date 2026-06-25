"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendingUp, TrendingDown, Search, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokens as mockTokens } from "@/lib/data";

const PAGE_SIZE = 15;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TokenItem {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
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

function formatVolume(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function TrendingList({
  currentAddress,
}: {
  currentAddress: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const { data } = useSWR("/api/tokens", fetcher, { refreshInterval: 30000 });
  const allTokens: TokenItem[] = data?.tokens ?? mockTokens;

  const filtered = query
    ? allTokens.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase())
      )
    : allTokens;

  // Paginate 15 per page (the last page may hold fewer). Clamp the active page
  // so it stays valid as the live list / search results change size underneath.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageTokens = filtered.slice(start, start + PAGE_SIZE);

  const onSearch = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Trending</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-green/40"
          />
        </div>
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {pageTokens.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-white/30">
            No tokens found
          </div>
        )}
        {pageTokens.map((token, i) => {
          const rank = start + i; // global rank across pages (0-based)
          const isActive = token.address === currentAddress;
          const isPositive = (token.change ?? 0) >= 0;

          return (
            <a
              key={`${token.address ?? ""}-${rank}`}
              href={`/trade/${token.address}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] cursor-pointer",
                isActive && "bg-accent-green/[0.06] border-l-2 border-l-accent-green"
              )}
            >
              {/* Icon */}
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
                      background: `${token.color ?? "#00FFA3"}20`,
                      color: token.color ?? "#00FFA3",
                    }}
                  >
                    {token.symbol?.[0]}
                  </div>
                )}
                {rank < 3 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[9px] font-bold text-white">
                    {rank + 1}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {token.symbol}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold flex items-center gap-0.5 shrink-0",
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
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-[11px] text-white/40 truncate">
                    {token.name}
                  </span>
                  <span className="text-[11px] font-mono text-white/60 shrink-0">
                    {formatPrice(token.price)}
                  </span>
                </div>
                <div className="text-[10px] text-white/25 mt-0.5">
                  Vol {formatVolume(token.volume ?? 0)}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination — 15 per page, last page may hold fewer. */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-white/[0.06] shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white/60 border border-white/10 rounded-md hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/60 disabled:hover:border-white/10"
          >
            <ChevronLeft className="w-3 h-3" />
            Prev
          </button>
          <span className="text-[11px] font-mono text-white/40">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white/60 border border-white/10 rounded-md hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/60 disabled:hover:border-white/10"
          >
            Next
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
