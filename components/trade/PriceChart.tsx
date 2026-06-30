"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1H" },
  { label: "4H", value: "4H" },
  { label: "1D", value: "1D" },
];

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function PriceChart({ address }: { address: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState("15m");
  // Price vs Market-Cap view. MCap mode scales every candle by circulating
  // supply (≈ marketCap / price), so the axis reads in dollars of market cap.
  const [denom, setDenom] = useState<"price" | "mcap">("price");

  const { data } = useSWR(
    `/api/ohlcv/${address}?type=${timeframe}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Token overview → supply multiplier for the MCap view.
  const { data: tokenResp } = useSWR(`/api/token/${address}`, fetcher, {
    refreshInterval: 30000,
  });
  const tk = tokenResp?.token as { price?: number; mc?: number } | undefined;
  const supply = tk?.price && tk?.mc ? tk.mc / tk.price : 0;
  const mult = denom === "mcap" && supply > 0 ? supply : 1;

  // Init chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    let cancelled = false;

    (async () => {
      const { createChart, CandlestickSeries, HistogramSeries, ColorType } =
        await import("lightweight-charts");

      if (cancelled || !chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "rgba(14,17,22,0.55)",
        },
        grid: {
          vertLines: { color: "rgba(14,17,22,0.06)" },
          horzLines: { color: "rgba(14,17,22,0.06)" },
        },
        crosshair: {
          vertLine: { color: "rgba(91,91,214,0.35)", width: 1 },
          horzLine: { color: "rgba(91,91,214,0.35)", width: 1 },
        },
        rightPriceScale: {
          borderColor: "rgba(14,17,22,0.10)",
        },
        timeScale: {
          borderColor: "rgba(14,17,22,0.10)",
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 340,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#16a34a",
        downColor: "#ef4444",
        borderUpColor: "#16a34a",
        borderDownColor: "#ef4444",
        wickUpColor: "#16a34a",
        wickDownColor: "#ef4444",
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "rgba(91,91,214,0.45)",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      chartRef.current = chart;
      seriesRef.current = { candle: candleSeries, volume: volumeSeries };

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when fetched
  useEffect(() => {
    if (!data?.candles || !seriesRef.current) return;
    const candles: Candle[] = data.candles;

    const cleaned = [...candles]
      .filter(
        (c) =>
          typeof c.time === "number" &&
          typeof c.open === "number" &&
          typeof c.high === "number" &&
          typeof c.low === "number" &&
          typeof c.close === "number"
      )
      .sort((a, b) => a.time - b.time);

    // lightweight-charts asserts strictly-ascending, unique timestamps.
    // Collapse any candles that share a time, keeping the last (freshest) one.
    const sorted: Candle[] = [];
    for (const c of cleaned) {
      const last = sorted[sorted.length - 1];
      if (last && last.time === c.time) {
        sorted[sorted.length - 1] = c;
      } else {
        sorted.push(c);
      }
    }

    seriesRef.current.candle.setData(
      sorted.map((c) => ({
        time: c.time as unknown,
        open: c.open * mult,
        high: c.high * mult,
        low: c.low * mult,
        close: c.close * mult,
      }))
    );

    seriesRef.current.volume.setData(
      sorted.map((c) => ({
        time: c.time as unknown,
        value: c.volume,
        color: c.close >= c.open
          ? "rgba(22,163,74,0.4)"
          : "rgba(239,68,68,0.4)",
      }))
    );

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, mult]);

  return (
    <div className="flex flex-col h-full">
      {/* Timeframe selector + Price/MCap toggle */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ink/[0.06]">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              timeframe === tf.value
                ? "bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/30"
                : "text-ink/40 hover:text-ink/70 hover:bg-ink/[0.04]"
            }`}
          >
            {tf.label}
          </button>
        ))}

        {/* Price / Market-Cap denomination toggle */}
        <div className="ml-auto flex items-center rounded-md bg-ink/[0.04] p-0.5">
          <button
            onClick={() => setDenom("price")}
            className={`px-2 py-0.5 text-[11px] rounded transition-all ${
              denom === "price" ? "bg-accent-indigo/20 text-accent-indigo" : "text-ink/40 hover:text-ink/70"
            }`}
          >
            Price
          </button>
          <button
            onClick={() => supply > 0 && setDenom("mcap")}
            disabled={supply <= 0}
            title={supply > 0 ? "Show market cap" : "Market cap unavailable"}
            className={`px-2 py-0.5 text-[11px] rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              denom === "mcap" ? "bg-accent-indigo/20 text-accent-indigo" : "text-ink/40 hover:text-ink/70"
            }`}
          >
            MCap
          </button>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1 min-h-[220px] sm:min-h-[300px]" />
    </div>
  );
}
