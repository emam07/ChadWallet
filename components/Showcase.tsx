"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BarChart3, LineChart, Star, Wallet, Bell } from "lucide-react";
import Reveal from "@/components/Reveal";

const sideItems = [
  { icon: LineChart, label: "Trade", active: true },
  { icon: BarChart3, label: "Markets", active: false },
  { icon: Wallet, label: "Portfolio", active: false },
  { icon: Star, label: "Watchlist", active: false },
  { icon: Bell, label: "Alerts", active: false },
];

// Parallax depth multipliers — glow drifts most, phone next, monitor least
// (spec: "Monitor moves slightly. Phone moves more. Glow moves the most.").
const DEPTH_MONITOR = 14;
const DEPTH_PHONE = 30;
const DEPTH_GLOW = 46;

// The live dashboard that sits *inside* the monitor screen. Kept as a separate
// layered mock (NOT a flattened image) so the frame and the screen content stay
// independent and the screen content can be swapped without touching the frame.
function DashboardScreen() {
  return (
    <div className="dash">
      <aside className="dash-side">
        {sideItems.map((s) => (
          <div className={`dash-side-item${s.active ? " active" : ""}`} key={s.label}>
            <s.icon size={15} />
            {s.label}
          </div>
        ))}
      </aside>

      <div className="dash-chart">
        <div className="dash-chart-head">
          <span style={{ fontWeight: 700 }}>SOL/USDC</span>
          <span className="dash-price">$187.42</span>
          <span className="dash-change">+8.34%</span>
        </div>
        <div className="dash-graph">
          <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="cw-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(91,140,255,0.35)" />
                <stop offset="100%" stopColor="rgba(91,140,255,0)" />
              </linearGradient>
            </defs>
            <polyline
              points="0,170 40,150 80,160 120,120 160,135 200,90 240,105 280,60 320,75 360,35 400,20"
              fill="none"
              stroke="#4d8cff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon
              points="0,170 40,150 80,160 120,120 160,135 200,90 240,105 280,60 320,75 360,35 400,20 400,220 0,220"
              fill="url(#cw-area)"
            />
          </svg>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-tabs">
          <div className="dash-tab buy">Buy</div>
          <div className="dash-tab sell">Sell</div>
        </div>
        <div className="dash-field">
          <span>Amount</span>
          <span style={{ color: "#f7f8fa", fontWeight: 700 }}>2.50 SOL</span>
        </div>
        <div className="dash-field">
          <span>≈ USD</span>
          <span style={{ color: "#f7f8fa", fontWeight: 700 }}>$468.55</span>
        </div>
        <div className="dash-cta">Swap now</div>
      </div>
    </div>
  );
}

export default function Showcase() {
  const sectionRef = useRef<HTMLElement>(null);

  // Normalised pointer offset from the section centre, range roughly [-0.5, 0.5].
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Smooth the raw pointer with a spring so motion eases instead of snapping.
  const sx = useSpring(px, { stiffness: 120, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 120, damping: 18, mass: 0.4 });

  const handlePointer = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetPointer = () => {
    px.set(0);
    py.set(0);
  };

  // Each layer translates by pointer × its depth multiplier. The transforms are
  // declared here at the top level of the component (not inside JSX) so the hook
  // calls run unconditionally in a stable order and satisfy the rules-of-hooks.
  const glowX = useTransform(sx, (v) => v * DEPTH_GLOW);
  const glowY = useTransform(sy, (v) => v * DEPTH_GLOW);
  const monitorX = useTransform(sx, (v) => v * DEPTH_MONITOR);
  const monitorY = useTransform(sy, (v) => v * DEPTH_MONITOR);
  const phoneX = useTransform(sx, (v) => v * DEPTH_PHONE);
  const phoneY = useTransform(sy, (v) => v * DEPTH_PHONE);

  return (
    <section
      ref={sectionRef}
      className="showcase-section"
      onMouseMove={handlePointer}
      onMouseLeave={resetPointer}
    >
      <motion.div
        className="showcase-glow"
        aria-hidden="true"
        style={{ x: glowX, y: glowY }}
      />
      <Reveal className="mockup-container">
        {/* ── Apple Studio Display style monitor ─────────────────────────────
            Layered: bezel housing → screen (clips content) → dashboard inside,
            then an aluminium neck + base below. The frame is built entirely in
            CSS so it stays separate from the screen content (spec requirement). */}
        <motion.div
          className="studio-monitor"
          style={{ x: monitorX, y: monitorY }}
        >
          <motion.div
            className="studio-float"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          >
            <div className="studio-bezel">
              <div className="studio-screen">
                {/* Absolutely-positioned, clipped screen content. Adjust inset
                    here if the dashboard ever needs to be nudged in the screen. */}
                <div className="studio-display">
                  <DashboardScreen />
                </div>
                <span className="studio-glare" aria-hidden="true" />
              </div>
            </div>
            <div className="studio-neck" aria-hidden="true" />
            <div className="studio-base" aria-hidden="true" />
          </motion.div>
        </motion.div>

        {/* Phone frame playing the ChadWallet app preview video */}
        <motion.div
          className="phone-frame"
          style={{ x: phoneX, y: phoneY }}
        >
          <motion.div
            className="phone-float"
            animate={{ y: [0, -18, 0], rotate: [-2, -2.6, -2] }}
            transition={{ duration: 6.5, ease: "easeInOut", repeat: Infinity }}
          >
            <div className="phone-screen">
              <div className="phone-notch" />
              <video
                className="phone-video"
                src="/video/chadwallet.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="ChadWallet mobile app preview"
              />
            </div>
          </motion.div>
        </motion.div>
      </Reveal>
    </section>
  );
}
