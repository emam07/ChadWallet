"use client";

import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart2, Activity } from "lucide-react";
import { marketTokens, type Token } from "@/lib/data";
import { cn, formatPercent } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Sparkline({ positive }: { positive: boolean }) {
  const points = positive
    ? "0,30 10,25 20,28 30,18 40,20 50,12 60,15 70,8 80,10 90,4 100,2"
    : "0,5 10,8 20,6 30,15 40,12 50,20 60,18 70,25 80,22 90,28 100,30";
  return (
    <svg width="80" height="32" viewBox="0 0 100 32" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#00FFA3" : "#f87171"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlashValue({ value, prefix = "" }: { value: string; prefix?: string }) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      prevRef.current = value;
      const t = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={cn("transition-colors duration-300", flash && "text-accent-green")}>
      {prefix}
      {value}
    </span>
  );
}

function formatPrice(p: number) {
  if (p < 0.0001) return p.toFixed(7);
  if (p < 0.01) return p.toFixed(5);
  if (p < 1) return p.toFixed(4);
  return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatVol(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function formatMCap(m: number) {
  if (m >= 1e9) return `$${(m / 1e9).toFixed(1)}B`;
  return `$${(m / 1e6).toFixed(0)}M`;
}

export default function MarketPreview() {
  // Live top-volume Solana tokens from the same endpoint the trade page uses
  // (GeckoTerminal → DexScreener → mock fallback). FlashValue highlights cells
  // that actually change between polls; no fabricated random-walk movement.
  const { data } = useSWR<{ tokens?: Token[] }>("/api/tokens", fetcher, {
    refreshInterval: 15000,
  });

  const rows: Token[] = (data?.tokens?.length ? data.tokens : marketTokens)
    .slice(0, 8)
    .map((t) => ({ ...t, color: t.color ?? "#00FFA3" }));

  return (
    <section id="market" className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-green/20 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8 sm:mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-green/20 text-xs font-mono text-accent-green mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              LIVE PRICES
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Market{" "}
              <span className="text-gradient-green">Overview</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Activity className="w-3.5 h-3.5 text-accent-green" />
              Updating live
            </div>
            <div className="flex items-center gap-2 text-xs font-mono glass border border-white/[0.06] px-3 py-1.5 rounded-lg text-white/50">
              <BarChart2 className="w-3.5 h-3.5" />
              Solana DEX
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-2xl border border-white/[0.06] overflow-hidden"
        >
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-white/[0.04] text-[11px] font-mono text-white/25 uppercase tracking-widest">
            <div>Token</div>
            <div className="text-right">Price</div>
            <div className="text-right">24h</div>
            <div className="text-right">Volume</div>
            <div className="text-right">Market Cap</div>
            <div className="text-right">7d Chart</div>
          </div>

          {rows.map((token, i) => {
            const positive = token.change >= 0;
            return (
              <motion.div
                key={token.address || token.symbol}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="group grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: `${token.color}20`, color: token.color }}
                  >
                    {token.symbol[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{token.symbol}</div>
                    <div className="text-xs text-white/30">{token.name}</div>
                  </div>
                </div>

                <div className="text-right font-mono text-sm font-semibold text-white sm:col-auto col-auto">
                  <FlashValue value={formatPrice(token.price)} prefix="$" />
                </div>

                <div
                  className={cn(
                    "text-right font-mono text-sm font-bold flex items-center justify-end gap-1",
                    positive ? "text-accent-green" : "text-red-400"
                  )}
                >
                  {positive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(token.change)}
                </div>

                <div className="text-right font-mono text-sm text-white/50 hidden sm:block">
                  {formatVol(token.volume)}
                </div>

                <div className="text-right font-mono text-sm text-white/50 hidden sm:block">
                  {formatMCap(token.marketCap)}
                </div>

                <div className="hidden sm:flex justify-end">
                  <Sparkline positive={positive} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <a
            href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent-green hover:text-accent-green/80 font-semibold transition-colors"
          >
            View all tokens in ChadWallet
            <TrendingUp className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
