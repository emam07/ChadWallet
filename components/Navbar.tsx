"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wallet, LogOut } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import logoSrc from "../assets/logo/light.png";

// Dynamically loaded Privy hooks — graceful if Privy not configured
function usePrivyAuth() {
  const [privyAvailable, setPrivyAvailable] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if Privy is configured
    if (process.env.NEXT_PUBLIC_PRIVY_APP_ID &&
        process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "your-privy-app-id-here") {
      setPrivyAvailable(true);
    }
  }, []);

  const login = () => {
    // Dispatch a custom event that providers.tsx / Privy can listen to
    window.dispatchEvent(new CustomEvent("privy:login"));
    // Also try direct button click if TW-modal is in DOM
    const btn = document.querySelector<HTMLButtonElement>("[data-privy-dialog-trigger]");
    if (btn) btn.click();
  };

  const logout = () => {
    setAuthenticated(false);
    setUserAddress(null);
    localStorage.removeItem("privy:user");
    window.dispatchEvent(new CustomEvent("privy:logout"));
  };

  return { privyAvailable, authenticated, userAddress, login, logout };
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Market", href: "#market" },
  { label: "How it Works", href: "#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { authenticated, userAddress, login, logout } = usePrivyAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "py-3 glass border-b border-white/5"
            : "py-5 bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="/" className="flex items-center" aria-label="ChadWallet home">
            <Image
              src={logoSrc}
              alt="ChadWallet"
              height={40}
              style={{ width: "auto", height: "40px" }}
              priority
            />
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-white/25 transition-all duration-200 group"
              aria-label="Download on App Store"
            >
              <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-white/50">Download on the</span>
                <span className="text-[11px] font-semibold text-white/90">App Store</span>
              </div>
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-white/25 transition-all duration-200 group"
              aria-label="Get it on Google Play"
            >
              <svg className="w-4 h-4 group-hover:opacity-100 opacity-80 transition-opacity" viewBox="0 0 24 24" fill="none">
                <path d="M3.18 23.5c.34.19.72.22 1.08.07l12.2-7.05-2.61-2.61L3.18 23.5z" fill="#EA4335"/>
                <path d="M21.36 10.27L18.7 8.74l-2.95 2.95 2.95 2.95 2.69-1.55a1.52 1.52 0 0 0 0-2.82z" fill="#FBBC04"/>
                <path d="M2.1.5A1.5 1.5 0 0 0 1.5 1.73v20.54a1.5 1.5 0 0 0 .6 1.23l.08.06 11.52-11.52v-.27L2.18.44 2.1.5z" fill="#4285F4"/>
                <path d="M13.85 12.04l2.9-2.9-12.2-7.07a1.54 1.54 0 0 0-1.37-.1l10.67 10.07z" fill="#34A853"/>
              </svg>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-white/50">Get it on</span>
                <span className="text-[11px] font-semibold text-white/90">Google Play</span>
              </div>
            </a>
            {authenticated ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 text-xs font-mono text-white/60 glass rounded-lg border border-white/10">
                  {userAddress
                    ? `${userAddress.slice(0, 4)}...${userAddress.slice(-4)}`
                    : "Connected"}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-white/40 hover:text-white glass rounded-lg border border-white/10 transition-all duration-200"
                  aria-label="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-accent-green text-black rounded-lg hover:bg-accent-green/90 hover:shadow-glow-green transition-all duration-200"
              >
                <Wallet className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-0 z-40 pt-20 pb-6 px-4 glass border-b border-white/5 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
