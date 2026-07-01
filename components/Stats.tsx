"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  /** Target value to count up to (null = static, e.g. "<1s"). */
  target: number | null;
  label: string;
  /** Formats the in-progress count into the displayed string. */
  format: (n: number) => string;
  static?: string;
}

const stats: Stat[] = [
  { target: 2_400_000_000, label: "Traded", format: (n) => `$${(n / 1_000_000_000).toFixed(1)}B+` },
  { target: 50_000, label: "Traders", format: (n) => `${Math.round(n / 1000)}K+` },
  { target: 1_000_000, label: "Transactions", format: (n) => `${(n / 1_000_000).toFixed(0)}M+` },
  { target: null, label: "Avg Swap Time", format: () => "", static: "<1s" },
];

/** Counts from 0 → target with requestAnimationFrame the first time the bar
 *  scrolls into view (IntersectionObserver), per the spec. */
function useCountUp(target: number | null, run: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!run || target === null) return;
    start.current = null;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const progress = Math.min((t - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [run, target, duration]);

  return value;
}

function StatItem({ stat, run }: { stat: Stat; run: boolean }) {
  const value = useCountUp(stat.target, run);
  return (
    <div className="stat">
      <span className="stat-value">{stat.static ?? stat.format(value)}</span>
      <span className="stat-label">{stat.label}</span>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRun(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-bar" ref={ref}>
      {stats.map((s) => (
        <StatItem key={s.label} stat={s} run={run} />
      ))}
    </section>
  );
}
