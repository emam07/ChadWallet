"use client";

import { useState, use, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePrivy } from "@privy-io/react-auth";
import useSWR from "swr";
import Image from "next/image";
import { TrendingUp, TrendingDown, Copy, ExternalLink, X, Globe, Twitter, Link as LinkIcon, Search, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingList } from "@/components/trade/TrendingList";
import { TradesFeed } from "@/components/trade/TradesFeed";
import { SwapPanel } from "@/components/trade/SwapPanel";
import { tokens as mockTokens } from "@/lib/data";
import logoSrc from "@/assets/logo/light.png";

const PriceChart = dynamic(
  () => import("@/components/trade/PriceChart").then((m) => ({ default: m.PriceChart })),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-ink/30 text-sm">Loading chart…</div> }
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

function StatCol({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="min-w-[72px]">
      <div className="text-[10px] uppercase tracking-wide text-ink/30 mb-0.5">{label}</div>
      <div className={cn("text-sm font-mono font-medium", accent ?? "text-ink")}>{value}</div>
    </div>
  );
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
  const liquidity = (tokenData?.liquidity as number) ?? 0;
  const logoURI = tokenData?.logoURI as string | undefined;
  const website = tokenData?.website as string | undefined;
  const socials = (tokenData?.socials as { type: string; url: string }[] | undefined) ?? [];
  const isPositive = change >= 0;
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 border-b border-ink/[0.06]">
      {/* Token identity */}
      <div className="flex items-center gap-3">
        {logoURI ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoURI} alt={symbol} className="w-12 h-12 rounded-full" />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
            style={{ background: "#f5c51820", color: "#f5c518" }}
          >
            {symbol[0]}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink text-base">{symbol}</span>
            <span className="text-xs text-ink/40">{name}</span>
            {/* Social / explorer icon row */}
            <span className="flex items-center gap-1.5 ml-1">
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-ink/30 hover:text-accent-indigo transition-colors" title="Website">
                  <Globe className="w-3.5 h-3.5" />
                </a>
              )}
              {socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-ink/30 hover:text-accent-indigo transition-colors" title={s.type}>
                  {s.type.toLowerCase() === "twitter" ? <Twitter className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                </a>
              ))}
              <a href={`https://solscan.io/token/${address}`} target="_blank" rel="noopener noreferrer" className="text-ink/30 hover:text-accent-indigo transition-colors" title="Solscan">
                <Search className="w-3.5 h-3.5" />
              </a>
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-[10px] text-ink/30">
              {truncate(address)}
            </span>
            <button
              onClick={copyAddress}
              className="text-ink/30 hover:text-ink/60 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={`https://solscan.io/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink/30 hover:text-ink/60 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            {copied && (
              <span className="text-[10px] text-accent-indigo">Copied!</span>
            )}
          </div>
        </div>
      </div>

      {/* 5-column labeled stats */}
      <div className="flex items-center gap-6 ml-auto">
        <StatCol label="Market Cap" value={formatNum(mc)} />
        <StatCol label="Price" value={formatPrice(price)} />
        <StatCol
          label="24H Change"
          accent={isPositive ? "text-accent-green" : "text-red-400"}
          value={
            <span className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </span>
          }
        />
        <StatCol label="24H Vol." value={formatNum(volume)} />
        <StatCol label="Liquidity" value={liquidity ? formatNum(liquidity) : "—"} />
      </div>
    </div>
  );
}

// Full-screen gate shown until the user signs in. The trade dashboard only
// mounts once Privy reports an authenticated session, so the page can never be
// reached (or its data loaded) by a logged-out visitor.
function LoginGate({ onLogin, busy }: { onLogin: () => void; busy: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-primary text-ink px-6 text-center">
      <a href="/" className="flex items-center gap-2 mb-8">
        <Image src={logoSrc} alt="Chad Wallet" height={36} style={{ width: "auto", height: "36px" }} />
        <span className="text-xl font-bold tracking-tight">
          Chad <span className="text-accent-indigo">Wallet</span>
        </span>
      </a>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-accent-indigo/10 border border-accent-indigo/20">
        <Lock className="w-5 h-5 text-accent-indigo" />
      </div>
      <h1 className="text-lg font-bold mb-2">Sign in to start trading</h1>
      <p className="text-sm text-ink/40 max-w-sm mb-7">
        The trading dashboard is for signed-in chads only. Log in to view charts,
        live swaps, and place trades.
      </p>
      <button
        onClick={onLogin}
        disabled={busy}
        className="px-7 py-3 text-sm font-bold bg-accent-indigo text-white rounded-xl hover:bg-accent-indigo/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Loading…" : "Log In / Sign Up"}
      </button>
      <a href="/" className="mt-5 text-xs text-ink/30 hover:text-ink/60 transition-colors">
        ← Back to home
      </a>
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
  const [query, setQuery] = useState("");
  const { ready, authenticated, login } = usePrivy();
  const userLoggedIn = ready && authenticated;

  // Don't fetch token data for logged-out visitors — the dashboard is gated
  // behind sign-in, so there is nothing to render until they authenticate.
  const { data: tokenResponse } = useSWR(
    userLoggedIn ? `/api/token/${address}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

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

  // Auth gate — the trade page is unreachable until the user signs in.
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary text-ink/40 text-sm">
        Loading…
      </div>
    );
  }
  if (!authenticated) {
    return <LoginGate onLogin={handleLogin} busy={false} />;
  }

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-ink overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-ink/[0.06] bg-bg-primary/90 backdrop-blur-sm shrink-0 z-20">
        {/* Left: wordmark + Trade tab (back button removed) */}
        <div className="flex items-center gap-4 shrink-0">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <Image src={logoSrc} alt="Chad Wallet" height={28} style={{ width: "auto", height: "28px" }} />
            <span className="hidden sm:inline text-sm font-bold tracking-tight text-ink">
              Chad <span className="text-accent-indigo">Wallet</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            <span className="px-3 py-1.5 text-xs font-semibold text-accent-indigo border-b-2 border-accent-indigo">
              Trade
            </span>
          </nav>
        </div>

        {/* Center: token search */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-ink/[0.04] border border-ink/[0.06] rounded-lg text-ink placeholder-ink/30 focus:outline-none focus:border-accent-indigo/40"
            />
          </div>
        </div>

        {/* Right: mobile controls + connection status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile (below tablet): trending toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden px-3 py-1.5 text-xs text-ink/60 border border-ink/10 rounded-lg hover:text-ink hover:border-ink/20 transition-all"
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

          <span className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium glass border border-ink/10 rounded-lg text-ink/80">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
            Connected
          </span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — trending tokens. Visible from tablet (md) up, narrower on tablet. */}
        <aside
          className={cn(
            "w-[200px] lg:w-[268px] shrink-0 border-r border-ink/[0.06] bg-bg-primary overflow-hidden flex-col",
            "hidden md:flex",
            // Mobile overlay (below tablet)
            sidebarOpen && "fixed inset-0 z-30 flex w-full sm:w-80 bg-bg-primary/95 backdrop-blur-sm"
          )}
        >
          {sidebarOpen && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink/[0.06] md:hidden">
              <span className="text-sm font-semibold">Trending</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-ink/50 hover:text-ink text-xs"
              >
                ✕ Close
              </button>
            </div>
          )}
          <TrendingList currentAddress={address} query={query} />
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
          <div className="flex-[0_0_280px] sm:flex-[0_0_320px] lg:flex-[0_0_340px] border-b border-ink/[0.06]">
            <PriceChart address={address} />
          </div>

          {/* Trades / Holders */}
          <div className="flex-1 overflow-hidden">
            <TradesFeed address={address} />
          </div>
        </main>

        {/* Right sidebar — swap panel. Narrower on tablet so all three panels fit. */}
        <aside className="w-[260px] lg:w-[300px] xl:w-[320px] shrink-0 border-l border-ink/[0.06] bg-bg-secondary/30 overflow-hidden hidden md:flex flex-col">
          <div className="px-4 py-3 border-b border-ink/[0.06]">
            <span className="text-sm font-semibold text-ink">Trade</span>
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
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-2xl border-t border-ink/[0.08] bg-bg-secondary shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink/[0.06]">
              <div>
                <span className="text-sm font-semibold text-ink">Trade</span>
              </div>
              <button
                onClick={() => setSwapOpen(false)}
                className="flex items-center gap-1 text-xs text-ink/50 hover:text-ink transition-colors"
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
