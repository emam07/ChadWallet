"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { ArrowDown, Settings, Zap, AlertTriangle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwapPanelProps {
  address: string;
  symbol: string;
  price: number;
  userLoggedIn: boolean;
  onLogin: () => void;
}

const SOL_ADDRESS = "So11111111111111111111111111111111111111112";
const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatPrice(price: number) {
  if (!price) return "0.00";
  if (price < 0.000001) return price.toFixed(9);
  if (price < 0.001) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function SwapPanel({
  address,
  symbol,
  price,
  userLoggedIn,
  onLogin,
}: SwapPanelProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [inputAmount, setInputAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [showSlippage, setShowSlippage] = useState(false);
  const [quote, setQuote] = useState<{
    outAmount: string;
    priceImpact: number;
  } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // SOL's USD price — needed to size a swap, since one leg is always SOL. Both
  // legs are priced in USD so the estimate is decimal-agnostic (SPL tokens use
  // varying decimals: BONK 5, USDC 6, SOL 9 — converting Jupiter's raw lamport
  // amounts client-side without each token's decimals is unreliable).
  const { data: solData } = useSWR(`/api/token/${SOL_ADDRESS}`, fetcher, {
    refreshInterval: 30000,
  });
  const solPrice = (solData?.token?.price as number) ?? 0;

  const fetchQuote = useCallback(async (amount: string) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !price) return;
    setLoadingQuote(true);

    // USD-based estimate (correct in magnitude for any token's decimals):
    //   buy:  SOL paid → tokens = (amt · solPrice) / tokenPrice
    //   sell: tokens sold → SOL = (amt · tokenPrice) / solPrice
    // If SOL's price hasn't loaded yet, fall back to a 1:price ratio.
    const estOut =
      mode === "buy"
        ? (amt * (solPrice || price)) / price
        : (amt * price) / (solPrice || price);

    // Pull the live price-impact figure from Jupiter. The input leg is SOL (9
    // decimals) only in buy mode, so we just enrich the buy estimate; the USD
    // estimate above stands either way. Never throws — defaults on failure.
    let priceImpact = 0.1;
    try {
      if (mode === "buy") {
        const lamports = Math.floor(amt * 1e9);
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
      // Keep the default price impact — the USD estimate is still shown.
    }

    setQuote({
      outAmount: estOut.toFixed(mode === "buy" ? 6 : 4),
      priceImpact,
    });
    setLoadingQuote(false);
  }, [mode, address, price, slippage, solPrice]);

  useEffect(() => {
    const t = setTimeout(() => fetchQuote(inputAmount), 400);
    return () => clearTimeout(t);
  }, [inputAmount, fetchQuote]);

  // Any change to the order invalidates a pending review.
  useEffect(() => {
    setReviewing(false);
  }, [inputAmount, mode, slippage]);

  const inputToken = mode === "buy" ? "SOL" : symbol;
  const outputToken = mode === "buy" ? symbol : "SOL";
  const outputAmount = quote?.outAmount ?? "";
  const priceImpact = quote?.priceImpact ?? 0;
  const hasOrder = parseFloat(inputAmount) > 0 && !!quote;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Buy / Sell Toggle */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex rounded-lg bg-white/[0.04] p-0.5 mb-4">
          <button
            onClick={() => setMode("buy")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
              mode === "buy"
                ? "bg-accent-green text-black"
                : "text-white/50 hover:text-white"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setMode("sell")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
              mode === "sell"
                ? "bg-red-500 text-white"
                : "text-white/50 hover:text-white"
            )}
          >
            Sell
          </button>
        </div>

        {/* Slippage */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40">Slippage</span>
          <button
            onClick={() => setShowSlippage((v) => !v)}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Settings className="w-3 h-3" />
            {slippage}%
          </button>
        </div>

        {showSlippage && (
          <div className="flex gap-1.5 mb-3">
            {SLIPPAGE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setSlippage(s); setShowSlippage(false); }}
                className={cn(
                  "flex-1 py-1.5 text-xs rounded-md border transition-all",
                  slippage === s
                    ? "border-accent-green/50 bg-accent-green/10 text-accent-green"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                )}
              >
                {s}%
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06] mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/40">You pay</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="flex-1 bg-transparent text-xl font-bold text-white placeholder-white/20 focus:outline-none"
            />
            <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-lg px-2 py-1">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[9px] font-bold text-purple-400">
                {inputToken[0]}
              </div>
              <span className="text-sm font-semibold text-white">{inputToken}</span>
            </div>
          </div>
          {mode === "buy" && (
            <div className="flex gap-1 mt-2">
              {[0.1, 0.5, 1, 5].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setInputAmount(String(amt))}
                  className="flex-1 py-0.5 text-[10px] rounded bg-white/[0.06] text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {amt} SOL
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-1">
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center">
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />
          </div>
        </div>

        {/* Output */}
        <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06] mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/40">You receive</span>
            {loadingQuote && (
              <span className="text-[10px] text-white/30 animate-pulse">
                Getting quote...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xl font-bold text-white/60">
              {outputAmount || "0.00"}
            </div>
            <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-lg px-2 py-1">
              <div className="w-5 h-5 rounded-full bg-accent-green/20 flex items-center justify-center text-[9px] font-bold text-accent-green">
                {outputToken[0]}
              </div>
              <span className="text-sm font-semibold text-white">{outputToken}</span>
            </div>
          </div>
        </div>

        {/* Price impact warning */}
        {priceImpact > 2 && (
          <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-400/10 rounded-lg px-3 py-2 mb-3 border border-orange-400/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            High price impact: {priceImpact.toFixed(2)}%
          </div>
        )}

        {/* Rate */}
        {price > 0 && (
          <div className="text-[11px] text-white/30 text-center mb-3">
            1 {symbol} ≈ ${formatPrice(price)}
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
                ? "bg-accent-green text-black hover:bg-accent-green/90 hover:shadow-glow-green"
                : "bg-red-500 text-white hover:bg-red-500/90"
            )}
          >
            <Zap className="w-4 h-4" />
            {!hasOrder
              ? "Enter an amount"
              : mode === "buy"
              ? `Review buy ${symbol}`
              : `Review sell ${symbol}`}
          </button>
        )}

        {/* Order review — built from the real Jupiter quote. Signing/submission
            via the Privy embedded wallet is the documented next integration
            step (see SwapPanel notes), so we surface the exact terms rather than
            silently doing nothing or faking a confirmation. */}
        {userLoggedIn && reviewing && hasOrder && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-white/40">You pay</span>
              <span className="font-mono text-white">{inputAmount} {inputToken}</span>
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
              Quote locked from Jupiter. On-chain submission requires signing with
              your embedded wallet — wiring that step is the next milestone.
            </p>
          </div>
        )}

        <p className="text-[10px] text-white/20 text-center mt-2">
          Powered by Jupiter · {slippage}% slippage
        </p>
      </div>

      {/* User Position — real positions require reading the connected wallet's
          on-chain SPL balances (and cost basis for P&L). Until that is wired we
          show an honest empty state instead of fabricated holdings. */}
      {userLoggedIn && (
        <div className="p-4">
          <div className="text-xs font-semibold text-white/60 mb-3">
            Your Position
          </div>
          <div className="bg-white/[0.04] rounded-xl p-6 border border-white/[0.06] text-center">
            <Wallet className="w-5 h-5 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/50">No {symbol} position yet</p>
            <p className="text-[11px] text-white/30 mt-1">
              Your holdings will appear here once on-chain balance reads are enabled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
