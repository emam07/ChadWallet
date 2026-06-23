"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Eye,
  Zap,
  Bell,
  Shield,
  Rocket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image, { StaticImageData } from "next/image";
import memeFlow from "../assets/flow/memecoin-4.png";
import kolFlow from "../assets/flow/kol-4.png";
import buySellFlow from "../assets/flow/buy-sell-4.png";
import portfolioFlow from "../assets/flow/portfolio-4.png";
import launchFlow from "../assets/flow/launch-4.png";
import relaunchFlow from "../assets/flow/relaunch-4.png";

const AUTO_MS = 4500;

const flowTabs: {
  label: string;
  tag: string;
  img: StaticImageData;
  color: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    label: "Spot Trends",
    tag: "DISCOVER",
    img: memeFlow,
    color: "#00FFA3",
    icon: TrendingUp,
    desc: "Our AI scans Solana in real time to surface tokens gaining momentum before they go viral.",
  },
  {
    label: "Follow Whales",
    tag: "INTELLIGENCE",
    img: kolFlow,
    color: "#6B5CFF",
    icon: Eye,
    desc: "Track whale wallets, copy top trader positions, and get alerted the moment a legend makes a move.",
  },
  {
    label: "Buy & Sell",
    tag: "EXECUTION",
    img: buySellFlow,
    color: "#00FFA3",
    icon: Zap,
    desc: "Sub-second swap execution with Jito MEV protection. Never get front-run. Always get the best price.",
  },
  {
    label: "Portfolio",
    tag: "PORTFOLIO",
    img: portfolioFlow,
    color: "#6B5CFF",
    icon: Bell,
    desc: "Track your holdings with real-time P&L, charts, and full token analytics at a glance.",
  },
  {
    label: "Launch Token",
    tag: "LAUNCH",
    img: launchFlow,
    color: "#00FFA3",
    icon: Rocket,
    desc: "Deploy your token directly from your phone in seconds — no desktop, no CLI needed.",
  },
  {
    label: "Relaunch",
    tag: "RELAUNCH",
    img: relaunchFlow,
    color: "#6B5CFF",
    icon: Shield,
    desc: "Give failed tokens a second chance with our streamlined one-tap relaunch flow.",
  },
];

const features = [
  {
    icon: TrendingUp,
    tag: "DISCOVER",
    title: "Spot Trends First",
    description:
      "Our AI scans the entire Solana ecosystem in real time to surface tokens gaining momentum before they go viral.",
    color: "#00FFA3",
    gradient: "from-accent-green/10 to-transparent",
  },
  {
    icon: Eye,
    tag: "INTELLIGENCE",
    title: "Follow Smart Money",
    description:
      "Track whale wallets, copy top trader positions, and get alerted the moment a legend makes a move.",
    color: "#6B5CFF",
    gradient: "from-accent-purple/10 to-transparent",
  },
  {
    icon: Zap,
    tag: "EXECUTION",
    title: "Trade Instantly",
    description:
      "Sub-second swap execution with Jito MEV protection. Never get front-run. Always get the best price.",
    color: "#00FFA3",
    gradient: "from-accent-green/10 to-transparent",
  },
  {
    icon: Bell,
    tag: "ALERTS",
    title: "Real-Time Alerts",
    description:
      "Price alerts, whale movements, new listings, and breakout notifications delivered in milliseconds.",
    color: "#6B5CFF",
    gradient: "from-accent-purple/10 to-transparent",
  },
  {
    icon: Shield,
    tag: "SECURITY",
    title: "Secure Wallet",
    description:
      "Non-custodial by design. Your keys never leave your device. Military-grade encryption with biometric unlock.",
    color: "#00FFA3",
    gradient: "from-accent-green/10 to-transparent",
  },
  {
    icon: Rocket,
    tag: "PERFORMANCE",
    title: "Lightning Fast Swaps",
    description:
      "Aggregated liquidity from Raydium, Orca, and Jupiter gives you the deepest pools and lowest slippage.",
    color: "#6B5CFF",
    gradient: "from-accent-purple/10 to-transparent",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 70 : -70,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -70 : 70,
    opacity: 0,
    scale: 0.97,
  }),
};

function FlowShowcase() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(Date.now());
  const pausedSinceRef = useRef<number>(0);

  // Compensate for pause duration so elapsed time is accurate
  useEffect(() => {
    if (paused) {
      pausedSinceRef.current = Date.now();
    } else if (pausedSinceRef.current > 0) {
      startRef.current += Date.now() - pausedSinceRef.current;
      pausedSinceRef.current = 0;
    }
  }, [paused]);

  // Reset timer when slide changes
  useEffect(() => {
    setProgress(0);
    startRef.current = Date.now();
    pausedSinceRef.current = 0;
  }, [active]);

  // Auto-advance ticker (~60fps)
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / AUTO_MS, 1);
      setProgress(p);
      if (p >= 1) {
        setDirection(1);
        setActive((a) => (a + 1) % flowTabs.length);
      }
    }, 16);
    return () => clearInterval(id);
  }, [paused]);

  const go = (i: number) => {
    if (i === active) return;
    setDirection(i > active ? 1 : -1);
    setActive(i);
  };

  const prev = () => {
    const i = (active - 1 + flowTabs.length) % flowTabs.length;
    setDirection(-1);
    setActive(i);
  };

  const next = () => {
    const i = (active + 1) % flowTabs.length;
    setDirection(1);
    setActive(i);
  };

  const tab = flowTabs[active];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7 }}
      className="mt-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Section label */}
      <div className="text-center mb-10">
        <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
          See it in action
        </p>
      </div>

      {/* Clickable feature cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {flowTabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = i === active;
          return (
            <motion.button
              key={t.tag}
              onClick={() => go(i)}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.95 }}
              className="relative rounded-xl p-3 text-left overflow-hidden transition-colors duration-200 glass border"
              style={{
                borderColor: isActive
                  ? `${t.color}45`
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {/* Active glow background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key="bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `${t.color}12` }}
                  />
                )}
              </AnimatePresence>

              {/* Progress bar — driven by progress state (~60fps) */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 pointer-events-none">
                  <div
                    className="h-full"
                    style={{ background: t.color, width: `${progress * 100}%` }}
                  />
                </div>
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 transition-transform duration-200"
                  style={{
                    background: `${t.color}20`,
                    border: `1px solid ${t.color}30`,
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: t.color }}
                  />
                </div>

                {/* Tag */}
                <span
                  className="text-[9px] font-mono font-bold tracking-widest block mb-0.5"
                  style={{ color: `${t.color}70` }}
                >
                  {t.tag}
                </span>

                {/* Label */}
                <span
                  className="text-xs font-semibold transition-colors duration-200"
                  style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.4)" }}
                >
                  {t.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Image viewer with arrows */}
      <div className="relative group/viewer">
        {/* Prev arrow */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all duration-200 opacity-0 group-hover/viewer:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] glass">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={tab.img}
                alt={`${tab.label} flow`}
                className="w-full h-auto"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority={active === 0}
              />
            </motion.div>
          </AnimatePresence>

          {/* Info overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="absolute bottom-0 left-0 right-0 px-6 py-5 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(3,3,5,0.85) 0%, rgba(3,3,5,0.3) 60%, transparent 100%)",
              }}
            >
              <span
                className="text-[10px] font-mono font-bold tracking-widest"
                style={{ color: tab.color }}
              >
                {tab.tag}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5 mb-1">
                {tab.label}
              </h3>
              <p className="text-sm text-white/50 max-w-md">{tab.desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Colour glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse at bottom, ${tab.color}08 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Next arrow */}
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all duration-200 opacity-0 group-hover/viewer:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dot / pill navigation */}
      <div className="flex justify-center items-center gap-2 mt-6">
        {flowTabs.map((t, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? "22px" : "6px",
              height: "6px",
              background:
                i === active ? tab.color : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-purple/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-green/20 text-xs font-mono text-accent-green mb-6">
            BUILT FOR WINNERS
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5">
            Everything you need to{" "}
            <span className="text-gradient-green">dominate</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Professional-grade tools in a wallet that fits in your pocket.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl glass border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-default overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: `${feature.color}15`,
                        border: `1px solid ${feature.color}25`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feature.color }} />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold tracking-widest"
                      style={{ color: `${feature.color}80` }}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/50 transition-colors">
                    {feature.description}
                  </p>
                </div>

                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feature.color}40, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        <FlowShowcase />
      </div>
    </section>
  );
}
