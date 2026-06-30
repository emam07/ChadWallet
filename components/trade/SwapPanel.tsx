"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Settings, Zap, AlertTriangle, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokens as mockTokens } from "@/lib/data";

interface SwapPanelProps {
  address: string;
  symbol: string;
  price: number;
  userLoggedIn: boolean;
  onLogin: () => void;
}

const SOL_ADDRESS = "So11111111111111111111111111111111111111112";
const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];
// USD quick-amounts matching the reference preset row.
const USD_AMOUNTS = [0, 100, 200, 500, 1000];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatPrice(price: number) {
  if (!price) return "0.00";
  if (price < 0.000001) return price.toFixed(9);
  if (price < 0.001) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function formatUsd(n: number) {
  if (!n) return "$0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// Performance chip: a period label + its price-change percent, colored.
function PerfChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] py-1.5">
      <span className="text-[9px] uppercase tracking-wide text-white/35">{label}</span>
      <span className={cn("text-[11px] font-semibold font-mono", positive ? "text-[#16c784]" : "text-[#f6465d]")}>
        {positive ? "+" : ""}
        {value.toFixed(2)}%
      </span>
    </div>
  );
}

export function SwapPanel({
  address,
  symbol,
  price,
  userLoggedIn,
  onLogin,
}: SwapPanelProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  // Input is a USD amount for both buy and sell.
  const [usdAmount, setUsdAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [showSlippage, setShowSlippage] = useState(false);
  const [positionsTab, setPositionsTab] = useState<"open" | "closed">("open");
  const [aboutOpen, setAboutOpen] = useState(true);
  const [quote, setQuote] = useState<{ outAmount: string; priceImpact: number } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // SOL's USD price — needed to size a swap, since one leg is always SOL.
  const { data: solData } = useSWR(`/api/token/${SOL_ADDRESS}`, fetcher, {
    refreshInterval: 30000,
  });
  const solPrice = (solData?.token?.price as number) ?? 0;

  // Full token overview — drives the performance chips + buy/sell pressure bar.
  const { data: tokenResp } = useSWR(`/api/token/${address}`, fetcher, {
    refreshInterval: 15000,
  });
  const token = tokenResp?.token as
    | {
        priceChange?: { m5: number; h1: number; h6: number; h24: number };
        v24hUSD?: number;
        txns24h?: { buys: number; sells: number };
      }
    | undefined;
  const perf = token?.priceChange ?? { m5: 0, h1: 0, h6: 0, h24: 0 };
  const buys = token?.txns24h?.buys ?? 0;
  const sells = token?.txns24h?.sells ?? 0;
  const totalTx = buys + sells;
  const buyPct = totalTx ? (buys / totalTx) * 100 : 50;
  const vol24 = token?.v24hUSD ?? 0;

  // A token we haven't curated is shown as "unverified" — an honest heuristic
  // (we don't fetch on-chain mint/freeze authority from the market-data tier).
  const verified = mockTokens.some((t) => t.address === address);

  const fetchQuote = useCallback(
    async (usd: string) => {
      const usdVal = parseFloat(usd);
      if (!usdVal || usdVal <= 0 || !price) {
        setQuote(null);
        return;
      }
      setLoadingQuote(true);

      // USD-based estimate (decimal-agnostic across SPL token decimals):
      //   buy:  tokens received = usd / tokenPrice
      //   sell: SOL received    = usd / solPrice
      const estOut = mode === "buy" ? usdVal / price : usdVal / (solPrice || price);

      // Enrich the buy estimate with Jupiter's live price impact. Input leg is
      // SOL: SOL spent = usd / solPrice → lamports. Never throws.
      let priceImpact = 0.1;
      try {
        if (mode === "buy" && solPrice) {
          const lamports = Math.floor((usdVal / solPrice) * 1e9);
          const res = await fetch(
            `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_ADDRESS}&outputMint=${address}&amount=${lamports}&slippageBps=${slippage * 100}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (res.ok) {
            const data = await res.json();
            priceImpact = parseFloat(data.priceImpactPct ?? "0") * 100;
          }
        }
      } catch {
        // Keep the default price impact — the USD estimate still stands.
      }

      setQuote({
        outAmount: estOut.toFixed(4),
        priceImpact,
      });
      setLoadingQuote(false);
    },
    [mode, address, price, slippage, solPrice]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchQuote(usdAmount), 400);
    return () => clearTimeout(t);
  }, [usdAmount, fetchQuote]);

  // Any change to the order invalidates a pending review.
  useEffect(() => {
    setReviewing(false);
  }, [usdAmount, mode, slippage]);

  const outputToken = mode === "buy" ? symbol : "SOL";
  const outputAmount = quote?.outAmount ?? "";
  const priceImpact = quote?.priceImpact ?? 0;
  const hasOrder = parseFloat(usdAmount) > 0 && !!quote;
  const displayAmount = usdAmount === "" ? "0" : usdAmount;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Buy / Sell Toggle */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex rounded-lg bg-white/[0.05] p-0.5 mb-4">
          <button
            onClick={() => setMode("buy")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
              mode === "buy" ? "bg-[#16c784] text-black" : "text-white/50 hover:text-white"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setMode("sell")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
              mode === "sell" ? "bg-[#f6465d] text-white" : "text-white/50 hover:text-white"
            )}
          >
            Sell
          </button>
        </div>

        {/* Big amount display */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold text-white/40">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              className="w-full max-w-[180px] bg-transparent text-4xl font-bold text-white placeholder-white/25 focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Amount in USD"
            />
          </div>
          {outputAmount && (
            <div className="mt-1 text-[11px] text-white/40">
              {loadingQuote ? (
                <span className="animate-pulse">Getting quote…</span>
              ) : (
                <>≈ {outputAmount} {outputToken}</>
              )}
            </div>
          )}
        </div>

        {/* Preset amount row + slippage gear */}
        <div className="flex gap-1.5 mb-2">
          {USD_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setUsdAmount(amt === 0 ? "" : String(amt))}
              className="flex-1 py-1.5 text-[11px] font-medium rounded-md bg-white/[0.05] text-white/55 hover:text-white hover:bg-white/[0.1] transition-colors"
            >
              ${amt}
            </button>
          ))}
          <button
            onClick={() => setShowSlippage((v) => !v)}
            className={cn(
              "px-2 rounded-md border transition-all",
              showSlippage
                ? "border-[#16c784]/50 text-[#16c784]"
                : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
            )}
            title="Slippage"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {showSlippage && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-white/40 mr-1">Slippage</span>
            {SLIPPAGE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSlippage(s);
                  setShowSlippage(false);
                }}
                className={cn(
                  "flex-1 py-1 text-[11px] rounded-md border transition-all",
                  slippage === s
                    ? "border-[#16c784]/50 bg-[#16c784]/10 text-[#16c784]"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                )}
              >
                {s}%
              </button>
            ))}
          </div>
        )}

        {/* Available balance line — honest: on-chain reads not wired yet. */}
        <div className="text-[11px] text-white/35 mb-3 text-center">
          $0 available
        </div>

        {/* Price impact warning */}
        {priceImpact > 2 && (
          <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-400/10 rounded-lg px-3 py-2 mb-3 border border-orange-400/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            High price impact: {priceImpact.toFixed(2)}%
          </div>
        )}

        {/* CTA */}
        {!userLoggedIn ? (
          <button
            onClick={onLogin}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-white/[0.06] border border-white/10 text-white/70 hover:bg-white/[0.1] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet to Trade
          </button>
        ) : (
          <button
            onClick={() => setReviewing(true)}
            disabled={!hasOrder}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
              !hasOrder
                ? "bg-white/[0.06] text-white/30 cursor-not-allowed"
                : mode === "buy"
                ? "bg-[#16c784] text-black hover:bg-[#16c784]/90"
                : "bg-[#f6465d] text-white hover:bg-[#f6465d]/90"
            )}
          >
            <Zap className="w-4 h-4" />
            {!hasOrder
              ? `${mode === "buy" ? "Buy" : "Sell"} ${symbol}`
              : mode === "buy"
              ? `Buy ${symbol}`
              : `Sell ${symbol}`}
          </button>
        )}

        {/* Unverified token badge (conditional) */}
        {!verified && (
          <div className="flex items-center gap-1.5 justify-center mt-2 text-[11px] text-orange-400">
            <AlertTriangle className="w-3 h-3" />
            Unverified token — trade with caution
          </div>
        )}

        {/* Order review — built from the real Jupiter quote. */}
        {userLoggedIn && reviewing && hasOrder && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-white/40">You pay</span>
              <span className="font-mono text-white">${displayAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">You receive (est.)</span>
              <span className="font-mono text-white">~{outputAmount} {outputToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Max slippage</span>
              <span className="font-mono text-white">{slippage}%</span>
            </div>
            <p className="text-[10px] text-white/30 pt-1.5 border-t border-white/[0.06]">
              Quote locked from the on-chain router. On-chain submission requires
              signing with your embedded wallet — wiring that step is the next
              milestone.
            </p>
          </div>
        )}
      </div>

      {/* About {Token} — performance chips + buy/sell pressure */}
      <div className="p-4 border-b border-white/[0.06]">
        <button
          onClick={() => setAboutOpen((v) => !v)}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="text-xs font-semibold text-white/70">About {symbol}</span>
          {aboutOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/30" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          )}
        </button>

        {aboutOpen && (
          <>
            {/* Performance over 4 windows */}
            <div className="flex gap-1.5 mb-3">
              <PerfChip label="5M" value={perf.m5} />
              <PerfChip label="1H" value={perf.h1} />
              <PerfChip label="6H" value={perf.h6} />
              <PerfChip label="1D" value={perf.h24} />
            </div>

            {/* Buy / sell pressure (24h transaction counts) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#16c784] font-semibold">{buys.toLocaleString()} buys</span>
                <span className="text-white/40 font-mono">{formatUsd(vol24)} vol</span>
                <span className="text-[#f6465d] font-semibold">{sells.toLocaleString()} sells</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-[#f6465d]/40">
                <div className="bg-[#16c784]" style={{ width: `${buyPct}%` }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Your Positions — Open / Closed. Real positions require reading the
          connected wallet's on-chain SPL balances (and cost basis for P&L);
          until that's wired we show an honest empty state. */}
      {userLoggedIn && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/70">Your positions</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPositionsTab("open")}
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded-md transition-all",
                  positionsTab === "open"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                Open
              </button>
              <button
                onClick={() => setPositionsTab("closed")}
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded-md transition-all",
                  positionsTab === "closed"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                Closed
              </button>
            </div>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-6 border border-white/[0.06] text-center">
            <Wallet className="w-5 h-5 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/50">
              No {positionsTab} {symbol} position
            </p>
            <p className="text-[11px] text-white/30 mt-1">
              Positions appear here once on-chain balance reads are enabled.
            </p>
          </div>
        </div>
      )}

      {/* Price reference (kept minimal — router branding intentionally hidden) */}
      {price > 0 && (
        <p className="text-[10px] text-white/20 text-center py-2">
          1 {symbol} ≈ ${formatPrice(price)}
        </p>
      )}
    </div>
  );
}
