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
    <section className="relative py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-green/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Phone showcase */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0 flex flex-col items-center gap-6"
          >
            {/* Glow */}
            <div className="absolute w-[300px] h-[300px] bg-accent-green/10 rounded-full blur-[80px] top-1/2 -translate-y-1/2" />

            {/* Phone frame */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-[220px] h-[440px] rounded-[36px] overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]"
            >
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
                    className="object-cover"
                    sizes="220px"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Screen tabs */}
            <div className="relative z-10 flex gap-2 flex-wrap justify-center max-w-[260px]">
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

          </motion.div>
        </div>
      </div>
    </section>
  );
}
