"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Wallet, X } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/us/app/chadwallet/id6757367474";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=xyz.chadwallet.www";

// Default token the trade dashboard opens once the user signs in via the
// navbar Login button (SOL) — matches Hero / CTA "Start trading".
const DEFAULT_TRADE_TOKEN = "So11111111111111111111111111111111111111112";

// NEXT_PUBLIC_* vars are inlined at build time, so this is a reliable signal on
// both server and client (no hydration mismatch). If false in a deployed build,
// <PrivyProvider> never mounted and login() can never open the popup — see
// app/providers.tsx and components/AuthButton.tsx for the full rationale.
const PRIVY_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "your-privy-app-id-here"
);

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/** Dark-themed login / account control. Wallet-connect logic via Privy is
 *  preserved verbatim from the previous AuthButton — only the styling changed. */
function LoginControl({ onAction }: { onAction?: () => void }) {
  const router = useRouter();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [pending, setPending] = useState(false);

  // Clicking Login should drop the user straight into the trade dashboard
  // instead of leaving them on the landing page. Privy's login() opens its
  // modal asynchronously, so we flag the intent and redirect from an effect
  // once `authenticated` flips true — the same pattern used by Hero / CTA.
  useEffect(() => {
    if (pending && authenticated) {
      setPending(false);
      router.push(`/trade/${DEFAULT_TRADE_TOKEN}`);
    }
  }, [pending, authenticated, router]);

  const handleLogin = useCallback(() => {
    if (!PRIVY_CONFIGURED) {
      console.error(
        "[ChadWallet] Login is unavailable because NEXT_PUBLIC_PRIVY_APP_ID was not " +
          "set when this build was created. Add it in your host's Environment Variables and redeploy."
      );
      return;
    }
    if (!ready) return;
    // Already signed in → go straight to trading. Otherwise open the Privy
    // modal and let the effect above redirect once auth completes.
    if (authenticated) {
      router.push(`/trade/${DEFAULT_TRADE_TOKEN}`);
      onAction?.();
      return;
    }
    setPending(true);
    login();
    onAction?.();
  }, [ready, authenticated, login, router, onAction]);

  if (ready && authenticated) {
    const label =
      user?.wallet?.address
        ? truncate(user.wallet.address)
        : user?.email?.address ?? user?.google?.email ?? user?.apple?.email ?? "Account";
    return (
      <div className="nav-account" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="login-btn" style={{ background: "#0b1626" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3ddc97", display: "inline-block" }} />
          {label}
        </span>
        <button
          className="login-btn"
          aria-label="Log out"
          onClick={() => {
            logout();
            onAction?.();
          }}
          style={{ padding: "10px 14px" }}
        >
          <LogOut size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      className="login-btn"
      aria-busy={PRIVY_CONFIGURED && !ready}
      title={
        PRIVY_CONFIGURED
          ? undefined
          : "Login unavailable: NEXT_PUBLIC_PRIVY_APP_ID is not configured on this deployment."
      }
      onClick={handleLogin}
    >
      <Wallet
        size={15}
        className={PRIVY_CONFIGURED && (!ready || (pending && !authenticated)) ? "animate-pulse" : undefined}
      />
      {pending && !authenticated ? "Opening sign in…" : "Login"}
    </button>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.18 23.5c.34.19.72.22 1.08.07l12.2-7.05-2.61-2.61L3.18 23.5z" fill="#EA4335" />
      <path d="M21.36 10.27L18.7 8.74l-2.95 2.95 2.95 2.95 2.69-1.55a1.52 1.52 0 0 0 0-2.82z" fill="#FBBC04" />
      <path d="M2.1.5A1.5 1.5 0 0 0 1.5 1.73v20.54a1.5 1.5 0 0 0 .6 1.23l.08.06 11.52-11.52v-.27L2.18.44 2.1.5z" fill="#4285F4" />
      <path d="M13.85 12.04l2.9-2.9-12.2-7.07a1.54 1.54 0 0 0-1.37-.1l10.67 10.07z" fill="#34A853" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <a href="/" className="nav-logo" aria-label="ChadWallet home">
        <img src="/logo/dark.png" alt="" className="nav-logo-img" aria-hidden="true" />
        chad wallet
      </a>

      <div className="nav-actions">
        <a className="store-btn" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          <AppleIcon />
          <span>
            Download on the
            <br />
            <b>App Store</b>
          </span>
        </a>
        <a className="store-btn" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          <GoogleIcon />
          <span>
            Get it on
            <br />
            <b>Google Play</b>
          </span>
        </a>
        <LoginControl />
        <button
          className="nav-burger"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          style={{ display: undefined }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 16,
            right: 16,
            zIndex: 49,
            background: "rgba(11,22,38,0.97)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <LoginControl onAction={() => setMobileOpen(false)} />
          <div style={{ display: "flex", gap: 10 }}>
            <a className="store-btn" style={{ flex: 1, justifyContent: "center" }} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <AppleIcon /> App Store
            </a>
            <a className="store-btn" style={{ flex: 1, justifyContent: "center" }} href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <GoogleIcon /> Google Play
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
