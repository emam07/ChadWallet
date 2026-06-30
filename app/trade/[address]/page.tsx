"use client";

import { useState, useEffect, useRef, use, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink,
  X,
  Globe,
  Twitter,
  Link as LinkIcon,
  Search,
  Lock,
  Bell,
  Coins,
  Trophy,
  Rss,
  Plus,
  LogOut,
} from "lucide-react";
import { DEFAULT_TRADE_TOKEN } from "@/hooks/useLoginAndTrade";
import { cn } from "@/lib/utils";
import { TrendingList } from "@/components/trade/TrendingList";
import { TradesFeed } from "@/components/trade/TradesFeed";
import { SwapPanel } from "@/components/trade/SwapPanel";
import { LeaderboardView } from "@/components/trade/LeaderboardView";
import { AlertsView } from "@/components/trade/AlertsView";
import { FeedView } from "@/components/trade/FeedView";
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

// Top-nav sections. Each switches the main content in-place: "Tokens" is the
// live trading dashboard, "Alerts" the price-alert manager, "Leaderboard" the
// ranked token board, and "Feed" the live swap tape for the open token.
const NAV_TABS = [
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "tokens", label: "Tokens", icon: Coins },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "feed", label: "Feed", icon: Rss },
] as const;

function StatCol({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="min-w-[64px]">
      <div className="text-[10px] uppercase tracking-wide text-white/35 mb-0.5">{label}</div>
      <div className={cn("text-sm font-mono font-semibold", accent ?? "text-white")}>{value}</div>
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
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 border-b border-white/[0.06]">
      {/* Token identity */}
      <div className="flex items-center gap-3">
        {logoURI ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoURI} alt={symbol} className="w-11 h-11 rounded-full ring-1 ring-white/10" />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold ring-1 ring-white/10"
            style={{ background: "#16c78420", color: "#16c784" }}
          >
            {symbol[0]}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{symbol}</span>
            <span className="text-xs text-white/40 truncate max-w-[140px]">{name}</span>
            {/* Social / explorer icon row */}
            <span className="flex items-center gap-1.5 ml-1">
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#16c784] transition-colors" title="Website">
                  <Globe className="w-3.5 h-3.5" />
                </a>
              )}
              {socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#16c784] transition-colors" title={s.type}>
                  {s.type.toLowerCase() === "twitter" ? <Twitter className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                </a>
              ))}
              <a href={`https://solscan.io/token/${address}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#16c784] transition-colors" title="Solscan">
                <Search className="w-3.5 h-3.5" />
              </a>
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-[10px] text-white/30">{truncate(address)}</span>
            <button onClick={copyAddress} className="text-white/30 hover:text-white/70 transition-colors">
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={`https://solscan.io/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            {copied && <span className="text-[10px] text-[#16c784]">Copied!</span>}
          </div>
        </div>
      </div>

      {/* Labeled stats strip */}
      <div className="flex items-center gap-5 ml-auto">
        <StatCol label="Price" value={formatPrice(price)} />
        <StatCol
          label="24H"
          accent={isPositive ? "text-[#16c784]" : "text-[#f6465d]"}
          value={
            <span className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          }
        />
        <StatCol label="Market cap" value={formatNum(mc)} />
        <StatCol label="24H volume" value={formatNum(volume)} />
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
    <div className="trade-root flex flex-col items-center justify-center h-screen px-6 text-center">
      <a href="/" className="flex items-center gap-2 mb-8">
        <Image src={logoSrc} alt="Chad Wallet" height={36} style={{ width: "auto", height: "36px" }} />
        <span className="text-xl font-bold tracking-tight text-white">
          Chad <span className="text-[#16c784]">Wallet</span>
        </span>
      </a>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-[#16c784]/10 border border-[#16c784]/20">
        <Lock className="w-5 h-5 text-[#16c784]" />
      </div>
      <h1 className="text-lg font-bold mb-2 text-white">Sign in to start trading</h1>
      <p className="text-sm text-white/45 max-w-sm mb-7">
        The trading dashboard is for signed-in chads only. Log in to view charts,
        live swaps, and place trades.
      </p>
      <button
        onClick={onLogin}
        disabled={busy}
        className="px-7 py-3 text-sm font-bold bg-[#16c784] text-black rounded-xl hover:bg-[#16c784]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Loading…" : "Log In / Sign Up"}
      </button>
      <a href="/" className="mt-5 text-xs text-white/30 hover:text-white/60 transition-colors">
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
  const [activeTab, setActiveTab] = useState<string>("tokens");
  const { ready, authenticated, login, logout, user } = usePrivy();
  const router = useRouter();
  const userLoggedIn = ready && authenticated;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Logout completes the loop: sign out via Privy, then land back on the
  // landing page. Re-logging in from there drops the user back at /trade.
  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

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
      <div className="trade-root flex items-center justify-center h-screen text-white/40 text-sm">
        Loading…
      </div>
    );
  }
  if (!authenticated) {
    return <LoginGate onLogin={handleLogin} busy={false} />;
  }

  return (
    <div className="trade-root flex flex-col h-screen overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0a0b0e]/90 backdrop-blur-sm shrink-0 z-20">
        {/* Left: wordmark + section tabs */}
        <div className="flex items-center gap-5 shrink-0">
          <button
            onClick={() => {
              setActiveTab("tokens");
              router.push(`/trade/${DEFAULT_TRADE_TOKEN}`);
            }}
            className="flex items-center gap-2 shrink-0"
            title="Trading dashboard"
          >
            <Image src={logoSrc} alt="Chad Wallet" height={26} style={{ width: "auto", height: "26px" }} />
            <span className="hidden sm:inline text-sm font-bold tracking-tight text-white">
              Chad <span className="text-[#16c784]">Wallet</span>
            </span>
          </button>
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: search */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search for tokens or traders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#16c784]/40"
            />
          </div>
        </div>

        {/* Right: balance + deposit + avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile (below tablet): trending toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden px-3 py-1.5 text-xs text-white/60 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
          >
            Tokens
          </button>

          {/* Mobile (below tablet): Buy/Sell — opens swap sheet, then returns to chart */}
          <button
            onClick={() => setSwapOpen(true)}
            className="md:hidden px-4 py-1.5 text-xs font-bold bg-[#16c784] text-black rounded-lg hover:bg-[#16c784]/90 transition-all"
          >
            Trade
          </button>

          {/* Wallet balance — on-chain reads aren't wired, so this honestly reads $0.00. */}
          <span className="hidden sm:flex items-center font-mono text-sm font-semibold text-white tabular-nums px-2">
            $0.00
          </span>
          <button
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#16c784] text-black rounded-lg hover:bg-[#16c784]/90 transition-all"
            title="Deposit"
          >
            <Plus className="w-3.5 h-3.5" />
            Deposit
          </button>
          {/* Account menu — logout lands back on the landing page. */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full shrink-0 ring-1 ring-white/10 hover:ring-white/30 transition-all"
              style={{ background: "linear-gradient(135deg,#f6465d,#16c784)" }}
              title="Account"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            />
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#14161c] shadow-2xl py-1.5 z-50">
                {(() => {
                  const label =
                    user?.wallet?.address
                      ? truncate(user.wallet.address)
                      : user?.email?.address ??
                        user?.google?.email ??
                        user?.apple?.email ??
                        "Account";
                  return (
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <div className="text-[10px] uppercase tracking-wide text-white/35">
                        Signed in as
                      </div>
                      <div className="text-xs font-mono text-white/80 truncate">{label}</div>
                    </div>
                  );
                })()}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-[#f6465d] hover:bg-white/[0.04] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main layout — the Tokens tab is the live trading dashboard; the other
          nav sections each render their own full-width, data-backed view. */}
      {activeTab !== "tokens" ? (
        <div className="flex-1 overflow-y-auto">
          {activeTab === "alerts" && <AlertsView currentAddress={address} />}
          {activeTab === "leaderboard" && <LeaderboardView />}
          {activeTab === "feed" && <FeedView address={address} symbol={symbol} />}
        </div>
      ) : (
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — trending tokens. Visible from tablet (md) up, narrower on tablet. */}
        <aside
          className={cn(
            "w-[212px] lg:w-[272px] shrink-0 border-r border-white/[0.06] bg-[#0a0b0e] overflow-hidden flex-col",
            "hidden md:flex",
            // Mobile overlay (below tablet)
            sidebarOpen && "fixed inset-0 z-30 flex w-full sm:w-80 bg-[#0a0b0e]/95 backdrop-blur-sm"
          )}
        >
          {sidebarOpen && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] md:hidden">
              <span className="text-sm font-semibold text-white">Tokens</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/50 hover:text-white text-xs"
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
          <div className="flex-[0_0_280px] sm:flex-[0_0_320px] lg:flex-[0_0_360px] border-b border-white/[0.06]">
            <PriceChart address={address} />
          </div>

          {/* Trades / Holders */}
          <div className="flex-1 overflow-hidden">
            <TradesFeed address={address} />
          </div>
        </main>

        {/* Right sidebar — swap panel. Narrower on tablet so all three panels fit. */}
        <aside className="w-[264px] lg:w-[312px] xl:w-[332px] shrink-0 border-l border-white/[0.06] bg-[#0c0d11] overflow-hidden hidden md:flex flex-col">
          <SwapPanel
            address={address}
            symbol={symbol}
            price={price}
            userLoggedIn={userLoggedIn}
            onLogin={handleLogin}
          />
        </aside>
      </div>
      )}

      {/* Mobile: swap bottom-sheet — opens on demand, dismiss to return to chart */}
      {swapOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop — tap to go back to chart */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSwapOpen(false)}
          />
          {/* Sheet */}
          <div className="trade-root absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-2xl border-t border-white/[0.08] bg-[#0c0d11] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">Trade {symbol}</span>
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
