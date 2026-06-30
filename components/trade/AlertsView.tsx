"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Bell, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokens as mockTokens } from "@/lib/data";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const ALERTS_KEY = "chadwallet:alerts";

interface TokenRow {
  symbol: string;
  name: string;
  address: string;
  price: number;
  logoURI?: string;
  color?: string;
}

interface Alert {
  id: string;
  address: string;
  symbol: string;
  target: number;
  direction: "above" | "below";
  createdAt: number;
}

function formatPrice(price: number) {
  if (!price) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(9)}`;
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

// localStorage-backed price alerts. Real and functional: alerts persist across
// sessions and are evaluated live against the trending feed's current prices.
// (Browser-side only — no push/email delivery is wired, so the UI surfaces the
// triggered state rather than claiming a notification was sent.)
function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ALERTS_KEY);
      if (raw) setAlerts(JSON.parse(raw) as Alert[]);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const persist = useCallback((next: Alert[]) => {
    setAlerts(next);
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  return { alerts, persist };
}

export function AlertsView({ currentAddress }: { currentAddress?: string }) {
  const { alerts, persist } = useAlerts();
  const { data } = useSWR("/api/tokens", fetcher, { refreshInterval: 30000 });
  const tokens: TokenRow[] = data?.tokens ?? mockTokens;

  const [selected, setSelected] = useState("");
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");

  // Default the token select to the token currently open (if it's in the list).
  useEffect(() => {
    if (!selected && tokens.length) {
      const preferred = tokens.find((t) => t.address === currentAddress);
      setSelected(preferred?.address ?? tokens[0].address);
    }
  }, [tokens, currentAddress, selected]);

  const priceOf = useCallback(
    (address: string) => tokens.find((t) => t.address === address)?.price ?? 0,
    [tokens]
  );

  const addAlert = () => {
    const tok = tokens.find((t) => t.address === selected);
    const value = parseFloat(target);
    if (!tok || !value || value <= 0) return;
    const next: Alert[] = [
      {
        id: `${tok.address}-${direction}-${value}-${alerts.length}`,
        address: tok.address,
        symbol: tok.symbol,
        target: value,
        direction,
        createdAt: 0,
      },
      ...alerts,
    ];
    persist(next);
    setTarget("");
  };

  const removeAlert = (id: string) => persist(alerts.filter((a) => a.id !== id));

  const isTriggered = (a: Alert) => {
    const price = priceOf(a.address);
    if (!price) return false;
    return a.direction === "above" ? price >= a.target : price <= a.target;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-[#16c784]" />
        <h1 className="text-lg font-bold text-white">Price Alerts</h1>
      </div>
      <p className="text-xs text-white/40 mb-5">
        Get a heads-up when a token crosses your target. Alerts are saved in this
        browser and checked live against current prices.
      </p>

      {/* Create alert */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-[#0a0b0e] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-[#16c784]/40"
          >
            {tokens.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} — {formatPrice(t.price)}
              </option>
            ))}
          </select>

          <div className="flex rounded-lg bg-white/[0.05] p-0.5">
            <button
              onClick={() => setDirection("above")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all",
                direction === "above" ? "bg-[#16c784] text-black" : "text-white/50 hover:text-white"
              )}
            >
              <ArrowUp className="w-3 h-3" /> Above
            </button>
            <button
              onClick={() => setDirection("below")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all",
                direction === "below" ? "bg-[#f6465d] text-white" : "text-white/50 hover:text-white"
              )}
            >
              <ArrowDown className="w-3 h-3" /> Below
            </button>
          </div>

          <div className="flex items-center gap-1 flex-1 px-3 py-2 bg-[#0a0b0e] border border-white/[0.1] rounded-lg">
            <span className="text-white/40 text-xs">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Target price"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <button
            onClick={addAlert}
            disabled={!selected || !(parseFloat(target) > 0)}
            className="flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold bg-[#16c784] text-black rounded-lg hover:bg-[#16c784]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="w-6 h-6 text-white/20 mb-3" />
          <p className="text-sm text-white/50">No alerts yet</p>
          <p className="text-[11px] text-white/30 mt-1">Create one above to start tracking a price.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const price = priceOf(a.address);
            const triggered = isTriggered(a);
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                  triggered
                    ? "border-[#16c784]/40 bg-[#16c784]/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    a.direction === "above" ? "bg-[#16c784]/15 text-[#16c784]" : "bg-[#f6465d]/15 text-[#f6465d]"
                  )}
                >
                  {a.direction === "above" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">
                    {a.symbol}{" "}
                    <span className="text-white/40 font-normal text-xs">
                      {a.direction === "above" ? "rises above" : "drops below"} {formatPrice(a.target)}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/35 mt-0.5">
                    Now: <span className="font-mono">{formatPrice(price)}</span>
                  </div>
                </div>
                {triggered && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#16c784] shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Triggered
                  </span>
                )}
                <button
                  onClick={() => removeAlert(a.id)}
                  className="text-white/25 hover:text-[#f6465d] transition-colors shrink-0"
                  title="Remove alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
