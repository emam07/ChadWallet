"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TIMEFRAMES = [
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

  const { data } = useSWR(
    `/api/ohlcv/${address}?type=${timeframe}`,
    fetcher,
    { refreshInterval: 60000 }
  );

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
          textColor: "rgba(255,255,255,0.4)",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: {
          vertLine: { color: "rgba(0,255,163,0.3)", width: 1 },
          horzLine: { color: "rgba(0,255,163,0.3)", width: 1 },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.06)",
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 340,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#00FFA3",
        downColor: "#FF4D4D",
        borderUpColor: "#00FFA3",
        borderDownColor: "#FF4D4D",
        wickUpColor: "#00FFA3",
        wickDownColor: "#FF4D4D",
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#26a69a",
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

    const sorted = [...candles].sort((a, b) => a.time - b.time);

    seriesRef.current.candle.setData(
      sorted.map((c) => ({
        time: c.time as unknown,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    seriesRef.current.volume.setData(
      sorted.map((c) => ({
        time: c.time as unknown,
        value: c.volume,
        color: c.close >= c.open
          ? "rgba(0,255,163,0.3)"
          : "rgba(255,77,77,0.3)",
      }))
    );

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              timeframe === tf.value
                ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            {tf.label}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-white/25 font-mono">
          Powered by TradingView
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1 min-h-[300px]" />
    </div>
  );
}
