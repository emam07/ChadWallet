"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const tokenPool = [
  { symbol: "SOL",    price: "$187.42",    change: "+8.34%",  color: "#9945FF" },
  { symbol: "BONK",  price: "$0.000034",  change: "+24.7%",  color: "#F7931A" },
  { symbol: "WIF",   price: "$2.14",      change: "+12.4%",  color: "#FF6B6B" },
  { symbol: "POPCAT",price: "$0.921",     change: "+41.3%",  color: "#FF8C94" },
  { symbol: "JUP",   price: "$1.23",      change: "+5.6%",   color: "#00FFA3" },
  { symbol: "PYTH",  price: "$0.387",     change: "+9.1%",   color: "#6B5CFF" },
  { symbol: "RAY",   price: "$4.88",      change: "+3.2%",   color: "#3FCFFF" },
  { symbol: "MEME",  price: "$0.0093",    change: "+67.8%",  color: "#FFD700" },
  { symbol: "ORCA",  price: "$3.14",      change: "+11.5%",  color: "#00C2FF" },
  { symbol: "SAMO",  price: "$0.0211",    change: "+18.9%",  color: "#F9A825" },
  { symbol: "COPE",  price: "$0.142",     change: "+22.3%",  color: "#FF4081" },
  { symbol: "GMT",   price: "$0.178",     change: "+4.7%",   color: "#A0FF72" },
];

const cardStartIndices = [0, 1, 2, 3];

function FloatingTokenCard({
  startIndex,
  delay,
  className,
}: {
  startIndex: number;
  delay: number;
  className?: string;
}) {
  const [index, setIndex] = useState(startIndex);
  const token = tokenPool[index % tokenPool.length];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timer = setTimeout(() => {
      interval = setInterval(() => {
        setIndex((prev) => (prev + cardStartIndices.length) % tokenPool.length);
      }, 3000);
    }, delay * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 + delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute glass rounded-xl px-3 py-2.5 border border-white/8 hover:border-accent-green/20 transition-colors cursor-pointer overflow-hidden ${className}`}
      style={{ animation: `float ${5 + delay}s ease-in-out ${delay}s infinite` }}
      whileHover={{ scale: 1.05 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2.5"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: `${token.color}20`, border: `1px solid ${token.color}40`, color: token.color }}
          >
            {token.symbol[0]}
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-none mb-0.5">{token.symbol}</div>
            <div className="text-[10px] text-white/40">{token.price}</div>
          </div>
          <div className="text-[11px] font-bold text-accent-green ml-1">{token.change}</div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
    />
  );
}

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(springY, [-300, 300], [5, -5]);
  const rotateY = useTransform(springX, [-500, 500], [-5, 5]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <GlowOrb className="w-[600px] h-[400px] bg-accent-green/8 top-[-10%] left-1/2 -translate-x-1/2" />
      <GlowOrb className="w-[400px] h-[400px] bg-accent-purple/10 top-1/4 right-[-5%]" />
      <GlowOrb className="w-[300px] h-[300px] bg-accent-green/6 bottom-1/4 left-[-5%]" />

      {/* Animated ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/[0.02] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-accent-green/[0.04] pointer-events-none animate-[spin_30s_linear_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-accent-purple/[0.06] pointer-events-none animate-[spin_20s_linear_infinite_reverse]" />

      {/* Floating token cards */}
      <FloatingTokenCard startIndex={0} delay={0}   className="left-[8%] top-[28%] hidden lg:block" />
      <FloatingTokenCard startIndex={1} delay={0.4} className="right-[8%] top-[32%] hidden lg:block" />
      <FloatingTokenCard startIndex={2} delay={0.8} className="left-[12%] bottom-[28%] hidden lg:block" />
      <FloatingTokenCard startIndex={3} delay={1.2} className="right-[10%] bottom-[32%] hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-green/20 text-xs font-mono text-accent-green mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          LIVE ON SOLANA MAINNET
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          style={{ rotateX, rotateY, perspective: 1000 }}
        >
          <span className="text-white">Trade Solana</span>
          <br />
          <span className="text-gradient-hero glow-text-green">Before Everyone</span>
          <br />
          <span className="text-white">Else.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-white/50 max-w-xl mb-10 leading-relaxed"
        >
          Discover trending tokens, track whales, and execute trades instantly with ChadWallet.
        </motion.p>

        {/* Product demo video */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[220px] mt-16"
        >
          <p className="text-xs font-mono text-white/25 uppercase tracking-widest text-center mb-4">
            See it in action
          </p>
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <video
              src="/video/chadwallet.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-auto block"
            />
            <div className="absolute inset-0 pointer-events-none border border-white/[0.04] rounded-2xl" />
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
    </section>
  );
}
