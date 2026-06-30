"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Reveal from "@/components/Reveal";

// Parallax depth multipliers — glow drifts most, phone next, monitor least
// (spec: "Monitor moves slightly. Phone moves more. Glow moves the most.").
const DEPTH_MONITOR = 14;
const DEPTH_PHONE = 30;
const DEPTH_GLOW = 46;

// The desktop screen content. Per prompts/uifixes.md the monitor now shows a
// real screenshot of the ChadWallet desktop dashboard (public/image.png) rather
// than a hand-built CSS mock, so it reads as a genuine desktop display.
function DashboardScreen() {
  return (
    <img
      className="studio-shot"
      src="/image.png"
      alt="ChadWallet desktop trading dashboard"
      draggable={false}
    />
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
