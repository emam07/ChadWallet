"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

// Default token the trade dashboard opens once the user signs in (SOL) — the
// single source of truth shared by every "Login / Start trading" entry point
// (Navbar, Hero, CTA).
export const DEFAULT_TRADE_TOKEN =
  "So11111111111111111111111111111111111111112";

// Persisted across a full-page OAuth redirect. Google (and Apple) login can
// navigate the whole tab away and back, which unmounts our components and wipes
// any React state — so the "redirect into the dashboard after login" intent
// must live somewhere that survives a reload. sessionStorage does; React state
// does not. This was the root cause of "after login we're still on the landing
// page": the previous fix flagged intent in component state that the OAuth
// round-trip destroyed before it could fire.
const REDIRECT_FLAG = "chad_post_login_redirect";

function setRedirectIntent() {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(REDIRECT_FLAG, "1");
    } catch {
      /* private mode / storage disabled — onComplete still covers the in-page flow */
    }
  }
}

function consumeRedirectIntent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(REDIRECT_FLAG)) {
      sessionStorage.removeItem(REDIRECT_FLAG);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Shared login → trade flow used by every sign-in button on the landing page.
 *
 * Two redirect paths, both required:
 *  1. `useLogin({ onComplete })` — Privy fires this the moment auth resolves for
 *     the in-page / popup flow (email, Google popup). Reliable and immediate.
 *  2. sessionStorage flag consumed in an effect — covers the FULL-PAGE OAuth
 *     redirect, where the component remounts and `onComplete` is registered on a
 *     fresh instance after auth already completed. The effect re-checks the flag
 *     on every mount once Privy is `ready && authenticated`.
 *
 * `start()` returns the action handler; `pending` drives the button's
 * "Opening sign in…" label (purely cosmetic — safe to lose across a reload).
 */
export function useLoginAndTrade(onAction?: () => void) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [pending, setPending] = useState(false);

  const goTrade = useCallback(() => {
    router.push(`/trade/${DEFAULT_TRADE_TOKEN}`);
  }, [router]);

  const { login } = useLogin({
    onComplete: () => {
      consumeRedirectIntent();
      setPending(false);
      goTrade();
    },
  });

  // Safety net for the full-page OAuth redirect (see REDIRECT_FLAG above).
  useEffect(() => {
    if (ready && authenticated && consumeRedirectIntent()) {
      setPending(false);
      goTrade();
    }
  }, [ready, authenticated, goTrade]);

  const start = useCallback(() => {
    // Already signed in → straight to trading, no modal.
    if (authenticated) {
      goTrade();
      onAction?.();
      return;
    }
    if (!ready) return;
    setRedirectIntent();
    setPending(true);
    login();
    onAction?.();
  }, [authenticated, ready, login, goTrade, onAction]);

  return { ready, authenticated, pending, start, goTrade };
}
