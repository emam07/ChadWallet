"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Fingerprint, Link, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Fingerprint,
    title: "Sign In",
    description:
      "Create your account in seconds with Face ID, email, or Google. No seed phrase memorization required on day one.",
    detail: "Powered by Privy secure key management",
    color: "#00FFA3",
  },
  {
    number: "02",
    icon: Link,
    title: "Connect Wallet",
    description:
      "Import an existing Solana wallet or let ChadWallet generate a non-custodial one for you. Fund via Apple Pay or crypto transfer.",
    detail: "Compatible with Phantom, Solflare, and all major wallets",
    color: "#6B5CFF",
  },
  {
    number: "03",
    icon: Zap,
    title: "Trade",
    description:
      "Discover trending tokens, set alerts, and execute trades with one tap. Sub-second confirmations on Solana.",
    detail: "MEV protection via Jito bundles",
    color: "#00FFA3",
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.8], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="relative py-32 px-4 sm:px-6 overflow-hidden" ref={containerRef}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-purple/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-purple/20 text-xs font-mono text-accent-purple mb-6">
            SIMPLE AS 1-2-3
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Up and trading in{" "}
            <span className="text-gradient-purple">60 seconds</span>
          </h2>
        </motion.div>

        <div className="relative flex flex-col md:flex-row gap-8 md:gap-6">
          {/* Vertical connecting line (mobile) */}
          <div className="absolute left-5 top-8 bottom-8 w-px bg-white/[0.04] md:hidden">
            <motion.div
              className="w-full bg-gradient-to-b from-accent-green to-accent-purple origin-top"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Horizontal connecting line (desktop) */}
          <div className="absolute hidden md:block top-10 left-[calc(16.666%+1.5rem)] right-[calc(16.666%+1.5rem)] h-px bg-white/[0.04]">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-green to-accent-purple origin-left"
              style={{ width: lineHeight }}
            />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex md:flex-col gap-5 md:gap-4 md:flex-1 pl-12 md:pl-0 md:text-center md:items-center"
              >
                <div className="shrink-0 relative">
                  <div
                    className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center relative z-10"
                    style={{
                      background: `${step.color}15`,
                      border: `1px solid ${step.color}30`,
                    }}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: step.color }} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                    style={{ background: step.color }}
                  />
                </div>

                <div className="flex-1 md:flex-none">
                  <div
                    className="text-xs font-mono font-bold mb-1.5"
                    style={{ color: `${step.color}60` }}
                  >
                    STEP {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg"
                    style={{
                      background: `${step.color}08`,
                      border: `1px solid ${step.color}20`,
                      color: `${step.color}80`,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
