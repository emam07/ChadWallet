"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="relative py-36 px-4 sm:px-6 overflow-hidden">
      {/* Deep background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent-green/7 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[350px] h-[350px] bg-accent-purple/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[250px] h-[250px] bg-accent-green/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Animated rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-accent-green/[0.05] pointer-events-none animate-[spin_25s_linear_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-accent-purple/[0.04] pointer-events-none animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.015] pointer-events-none animate-[spin_60s_linear_infinite]" />

      {/* Top separator line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-green/20 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-green border border-accent-green/20 text-xs font-mono text-accent-green mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
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

          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.a
              href="https://apps.apple.com/us/app/chadwallet/id6757367474"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download ChadWallet on the App Store"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all duration-300"
            >
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[11px] text-black/50 mb-1">Download on the</span>
                <span className="text-lg font-bold">App Store</span>
              </div>
            </motion.a>

            <motion.a
              href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get ChadWallet on Google Play"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl glass border border-white/15 hover:border-accent-green/40 hover:shadow-glow-green transition-all duration-300"
            >
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M3.18 23.5c.34.19.72.22 1.08.07l12.2-7.05-2.61-2.61L3.18 23.5z" fill="#EA4335"/>
                <path d="M21.36 10.27L18.7 8.74l-2.95 2.95 2.95 2.95 2.69-1.55a1.52 1.52 0 0 0 0-2.82z" fill="#FBBC04"/>
                <path d="M2.1.5A1.5 1.5 0 0 0 1.5 1.73v20.54a1.5 1.5 0 0 0 .6 1.23l.08.06 11.52-11.52v-.27L2.18.44 2.1.5z" fill="#4285F4"/>
                <path d="M13.85 12.04l2.9-2.9-12.2-7.07a1.54 1.54 0 0 0-1.37-.1l10.67 10.07z" fill="#34A853"/>
              </svg>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[11px] text-white/40 mb-1">Get it on</span>
                <span className="text-lg font-bold text-white">Google Play</span>
              </div>
            </motion.a>
          </div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-6 mt-10"
          >
            {[
              { label: "Non-custodial", icon: "🔐" },
              { label: "MEV protected", icon: "⚡" },
              { label: "Sub-second swaps", icon: "🚀" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-white/25 font-mono">
                <span>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
