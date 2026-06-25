"use client";

import { useState, use } from "react";
import dynamic from "next/dynamic";
import { usePrivy } from "@privy-io/react-auth";
import useSWR from "swr";
import Image from "next/image";
import { ArrowLeft, TrendingUp, TrendingDown, Copy, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingList } from "@/components/trade/TrendingList";
import { TradesFeed } from "@/components/trade/TradesFeed";
import { SwapPanel } from "@/components/trade/SwapPanel";
import { tokens as mockTokens } from "@/lib/data";
import logoSrc from "@/assets/logo/light.png";

const PriceChart = dynamic(
  () => import("@/components/trade/PriceChart").then((m) => ({ default: m.PriceChart })),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Loading chart…</div> }
);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatPrice(price: number) {
  if (!price) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(9)}`;
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatNum(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function TokenHeader({
  address,
  tokenData,
}: {
  address: string;
  tokenData: Record<string, unknown> | null;
}) {
  const fallback = mockTokens.find((t) => t.address === address);
  const symbol = (tokenData?.symbol as string) ?? fallback?.symbol ?? "???";
  const name = (tokenData?.name as string) ?? fallback?.name ?? "Unknown Token";
  const price = (tokenData?.price as number) ?? fallback?.price ?? 0;
  const change = (tokenData?.priceChange24hPercent as number) ?? fallback?.change ?? 0;
  const volume = (tokenData?.v24hUSD as number) ?? fallback?.volume ?? 0;
  const mc = (tokenData?.mc as number) ?? fallback?.marketCap ?? 0;
  const logoURI = tokenData?.logoURI as string | undefined;
  const isPositive = change >= 0;
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-white/[0.06]">
      {/* Token identity */}
      <div className="flex items-center gap-3">
        {logoURI ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoURI} alt={symbol} className="w-9 h-9 rounded-full" />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "#00FFA320", color: "#00FFA3" }}
          >
            {symbol[0]}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{symbol}</span>
            <span className="text-xs text-white/40">{name}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-[10px] text-white/30">
              {truncate(address)}
            </span>
            <button
              onClick={copyAddress}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={`https://solscan.io/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            {copied && (
              <span className="text-[10px] text-accent-green">Copied!</span>
            )}
          </div>
        </div>
      </div>

      {/* Price + change */}
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold font-mono text-white">
          {formatPrice(price)}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-semibold mb-0.5",
            isPositive ? "text-accent-green" : "text-red-400"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 ml-auto">
        <div>
          <div className="text-[10px] text-white/30 mb-0.5">24h Volume</div>
          <div className="text-sm font-mono font-medium text-white">{formatNum(volume)}</div>
        </div>
        <div>
          <div className="text-[10px] text-white/30 mb-0.5">Market Cap</div>
          <div className="text-sm font-mono font-medium text-white">{formatNum(mc)}</div>
        </div>
      </div>
    </div>
  );
}

export default function TradePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const { ready, authenticated, login } = usePrivy();
  const userLoggedIn = ready && authenticated;

  const { data: tokenResponse } = useSWR(`/api/token/${address}`, fetcher, {
    refreshInterval: 10000,
  });

  const tokenData = tokenResponse?.token ?? null;
  const price =
    (tokenData?.price as number) ??
    mockTokens.find((t) => t.address === address)?.price ??
    0;
  const symbol =
    (tokenData?.symbol as string) ??
    mockTokens.find((t) => t.address === address)?.symbol ??
    "???";

  const handleLogin = () => {
    if (ready && !authenticated) login();
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-white overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-bg-primary/90 backdrop-blur-sm shrink-0 z-20">
        <div className="flex items-center gap-4">
          <a href="/" className="shrink-0">
            <Image src={logoSrc} alt="ChadWallet" height={32} style={{ width: "auto", height: "32px" }} />
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </a>
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <span className="px-3 py-1.5 text-xs font-medium text-accent-green border-b border-accent-green">
              Trade
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile (below tablet): trending toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden px-3 py-1.5 text-xs text-white/60 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Trending
          </button>

          {/* Mobile (below tablet): Buy/Sell — opens swap sheet, then returns to chart */}
          <button
            onClick={() => setSwapOpen(true)}
            className="md:hidden px-4 py-1.5 text-xs font-bold bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition-all"
          >
            Buy / Sell
          </button>

          {userLoggedIn ? (
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium glass border border-white/10 rounded-lg text-white/80 hover:text-white transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              Connected
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-1.5 text-xs font-bold bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — trending tokens. Visible from tablet (md) up, narrower on tablet. */}
        <aside
          className={cn(
            "w-[200px] lg:w-[268px] shrink-0 border-r border-white/[0.06] bg-bg-primary overflow-hidden flex-col",
            "hidden md:flex",
            // Mobile overlay (below tablet)
            sidebarOpen && "fixed inset-0 z-30 flex w-full sm:w-80 bg-bg-primary/95 backdrop-blur-sm"
          )}
        >
          {sidebarOpen && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] md:hidden">
              <span className="text-sm font-semibold">Trending</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/50 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
          )}
          <TrendingList currentAddress={address} />
        </aside>

        {/* Mobile sidebar overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Center — chart + trades */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Token header */}
          <TokenHeader address={address} tokenData={tokenData} />

          {/* Chart */}
          <div className="flex-[0_0_280px] sm:flex-[0_0_320px] lg:flex-[0_0_340px] border-b border-white/[0.06]">
            <PriceChart address={address} />
          </div>

          {/* Trades / Holders */}
          <div className="flex-1 overflow-hidden">
            <TradesFeed address={address} />
          </div>
        </main>

        {/* Right sidebar — swap panel. Narrower on tablet so all three panels fit. */}
        <aside className="w-[260px] lg:w-[300px] xl:w-[320px] shrink-0 border-l border-white/[0.06] bg-bg-secondary/30 overflow-hidden hidden md:flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="text-sm font-semibold text-white">Trade</span>
            <span className="ml-2 text-xs text-white/30">via Jupiter</span>
          </div>
          <SwapPanel
            address={address}
            symbol={symbol}
            price={price}
            userLoggedIn={userLoggedIn}
            onLogin={handleLogin}
          />
        </aside>
      </div>

      {/* Mobile: swap bottom-sheet — opens on demand, dismiss to return to chart */}
      {swapOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop — tap to go back to chart */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSwapOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-2xl border-t border-white/[0.08] bg-bg-secondary shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div>
                <span className="text-sm font-semibold text-white">Trade</span>
                <span className="ml-2 text-[10px] text-white/30">via Jupiter</span>
              </div>
              <button
                onClick={() => setSwapOpen(false)}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SwapPanel
                address={address}
                symbol={symbol}
                price={price}
                userLoggedIn={userLoggedIn}
                onLogin={handleLogin}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
