"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { label: "Active Traders", end: 247, prefix: "", suffix: "K+", decimals: 0, tag: "COMMUNITY" },
  { label: "Daily Volume", end: 1.4, prefix: "$", suffix: "B+", decimals: 1, tag: "LIQUIDITY" },
  { label: "Swaps Executed", end: 4.2, prefix: "", suffix: "M+", decimals: 1, tag: "TRANSACTIONS" },
  { label: "Avg Execution", end: 0.4, prefix: "", suffix: "s", decimals: 1, tag: "SPEED" },
];

function CountUp({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="relative py-28 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-green/[0.02] via-accent-purple/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-purple/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-green/20 text-xs font-mono text-accent-green mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            BY THE NUMBERS
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Traders trust{" "}
            <span className="text-gradient-green">ChadWallet</span>
          </h2>
          <p className="text-white/30 text-base mt-4 font-mono">
            Real-time stats from Solana mainnet
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group relative glass rounded-2xl border border-white/[0.06] hover:border-accent-green/20 p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-glow-green overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-green/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10">
                <div className="text-[10px] font-mono text-white/20 tracking-widest mb-3 group-hover:text-accent-green/50 transition-colors duration-300">
                  {stat.tag}
                </div>
                <div className="text-3xl sm:text-5xl font-bold tracking-tight text-gradient-green mb-2">
                  <CountUp
                    end={stat.end}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </div>
                <div className="text-sm text-white/40 font-medium">{stat.label}</div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
