"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative py-36 px-4 sm:px-6 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-green/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[300px] h-[300px] bg-accent-purple/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50 pointer-events-none" />

      {/* Animated rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-accent-green/[0.05] pointer-events-none animate-[spin_25s_linear_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-accent-purple/[0.04] pointer-events-none animate-[spin_40s_linear_infinite_reverse]" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-green border border-accent-green/20 text-xs font-mono text-accent-green mb-8">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            START TRADING IN 60 SECONDS
          </div>

          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02] mb-6">
            Your Next{" "}
            <span className="text-gradient-hero">100x</span>
            <br />
            Starts Here.
          </h2>

          <p className="text-white/40 text-xl max-w-lg mx-auto mb-12 leading-relaxed">
            Join 247,000+ traders already using ChadWallet to find the next moonshot before it moons.
          </p>

        </motion.div>
      </div>
    </section>
  );
}
