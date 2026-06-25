"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Star } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import discoverImg from "../assets/app store/discover.png";
import portfolioImg from "../assets/app store/portfolio.png";
import tokenImg from "../assets/app store/token.png";
import searchImg from "../assets/app store/search.png";
import kolImg from "../assets/app store/kol.png";
import depositImg from "../assets/app store/deposit.png";

const screens: { key: string; label: string; img: StaticImageData }[] = [
  { key: "discover", label: "Discover", img: discoverImg },
  { key: "portfolio", label: "Portfolio", img: portfolioImg },
  { key: "token", label: "Token", img: tokenImg },
  { key: "search", label: "Search", img: searchImg },
  { key: "kol", label: "Whales", img: kolImg },
  { key: "deposit", label: "Deposit", img: depositImg },
];

export default function MobileApp() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-green/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-16 lg:gap-24">
          {/* Phone showcase */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0 flex flex-col items-center gap-6"
          >
            {/* Glow */}
            <div className="absolute w-[462px] h-[462px] bg-accent-green/10 rounded-full blur-[100px] top-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Outer phone body */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              {/* Side buttons — volume up */}
              <div className="absolute -left-[3px] top-[134px] w-[3px] h-10 rounded-l-full bg-white/10 shadow-inner" />
              <div className="absolute -left-[3px] top-[189px] w-[3px] h-10 rounded-l-full bg-white/10 shadow-inner" />
              {/* Side buttons — power */}
              <div className="absolute -right-[3px] top-[158px] w-[3px] h-14 rounded-r-full bg-white/10 shadow-inner" />

              {/* Phone shell */}
              <div
                className="relative rounded-[53px] p-[3px]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)",
                  boxShadow:
                    "0 50px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                {/* Inner bezel */}
                <div className="relative w-[329px] h-[585px] rounded-[50px] bg-black overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-[101px] h-[31px] bg-black rounded-b-2xl flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-[8px] h-[8px] rounded-full bg-white/20 border border-white/10" />
                  </div>

                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 z-10 h-10 flex items-center justify-between px-7 pt-1">
                    <span className="text-[11px] font-bold text-white/60 font-mono">9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                      </svg>
                      <svg className="w-4 h-3 text-white/60" viewBox="0 0 24 16" fill="currentColor">
                        <rect x="0" y="0" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="21" y="4" width="3" height="8" rx="1" fill="currentColor" opacity="0.4" />
                        <rect x="1.5" y="1.5" width="14" height="13" rx="1" fill="currentColor" />
                      </svg>
                    </div>
                  </div>

                  {/* Screenshot switcher */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={screens[active].img}
                        alt={`ChadWallet ${screens[active].label} screen`}
                        fill
                        className="object-fill"
                        sizes="329px"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Bottom home indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-28 h-1 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Screen reflection */}
              <div
                className="absolute inset-[3px] rounded-[50px] pointer-events-none z-20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
                }}
              />
            </motion.div>

            {/* Screen tabs */}
            <div className="relative z-10 flex gap-2 flex-wrap justify-center max-w-[350px]">
              {screens.map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => setActive(i)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all duration-200 ${
                    i === active
                      ? "bg-accent-green text-black"
                      : "glass border border-white/10 text-white/40 hover:text-white hover:border-white/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 max-w-lg"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-green/20 text-xs font-mono text-accent-green mb-6">
              <Smartphone className="w-3.5 h-3.5" />
              MOBILE APP
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
              Your entire portfolio,{" "}
              <span className="text-gradient-green">in your pocket</span>
            </h2>

            <p className="text-white/40 text-lg leading-relaxed mb-8">
              The ChadWallet app brings institutional-grade trading to your phone.
              One-tap execution, live whale alerts, and a portfolio dashboard that
              actually looks good.
            </p>

            <div className="flex items-center gap-2 mb-8">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-white/50">
                4.9 · <span className="text-white/30">12,400+ reviews</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://apps.apple.com/us/app/chadwallet/id6757367474"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download ChadWallet on the App Store"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-black/50 mb-0.5">Download on the</span>
                  <span className="text-sm font-bold">App Store</span>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get ChadWallet on Google Play"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl glass border border-white/10 hover:border-accent-green/30 hover:shadow-glow-green transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M3.18 23.5c.34.19.72.22 1.08.07l12.2-7.05-2.61-2.61L3.18 23.5z" fill="#EA4335"/>
                  <path d="M21.36 10.27L18.7 8.74l-2.95 2.95 2.95 2.95 2.69-1.55a1.52 1.52 0 0 0 0-2.82z" fill="#FBBC04"/>
                  <path d="M2.1.5A1.5 1.5 0 0 0 1.5 1.73v20.54a1.5 1.5 0 0 0 .6 1.23l.08.06 11.52-11.52v-.27L2.18.44 2.1.5z" fill="#4285F4"/>
                  <path d="M13.85 12.04l2.9-2.9-12.2-7.07a1.54 1.54 0 0 0-1.37-.1l10.67 10.07z" fill="#34A853"/>
                </svg>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-white/40 mb-0.5">Get it on</span>
                  <span className="text-sm font-bold text-white">Google Play</span>
                </div>
              </a>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
