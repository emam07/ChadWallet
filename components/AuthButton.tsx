"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { LogOut, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// NEXT_PUBLIC_* vars are inlined at BUILD time, so this is a reliable signal —
// readable identically on server and client (no hydration mismatch). If it is
// false in a deployed build, the env var was not set on the host (e.g. Vercel)
// when the app was built, so <PrivyProvider> never mounted and login() can
// never open the Google/Apple popup. See app/providers.tsx.
const PRIVY_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "your-privy-app-id-here"
);

interface AuthButtonProps {
  fullWidth?: boolean;
  /** Called after a login/logout action is triggered (e.g. to close a mobile menu). */
  onAction?: () => void;
}

export function AuthButton({ fullWidth, onAction }: AuthButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // The logged-out "Log In" button is the default for BOTH the
  // server render and the first client paint, so hydration matches. We only
  // swap to the account view once Privy is ready *and* authenticated. This
  // guarantees the Log In button is always visible even if the Privy SDK is
  // slow or fails to initialize — never a blank placeholder.
  if (ready && authenticated) {
    const label =
      user?.wallet?.address
        ? truncate(user.wallet.address)
        : user?.email?.address ??
          user?.google?.email ??
          user?.apple?.email ??
          "Account";

    return (
      <div className={cn("flex items-center gap-2", fullWidth && "w-full")}>
        <span
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-sm font-medium glass border border-ink/10 rounded-lg text-ink/80",
            fullWidth && "flex-1 justify-center"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          {label}
        </span>
        <button
          onClick={() => {
            logout();
            onAction?.();
          }}
          aria-label="Log out"
          className="flex items-center justify-center px-3 py-2 rounded-lg glass border border-ink/10 text-ink/60 hover:text-ink hover:border-ink/25 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      // Before Privy finishes initializing, `login()` is a no-op, so disable
      // the click but keep the button fully visible (just a subtle pulse on
      // the icon) so users always see the Log In affordance.
      onClick={() => {
        if (!PRIVY_CONFIGURED) {
          console.error(
            "[ChadWallet] Login is unavailable because NEXT_PUBLIC_PRIVY_APP_ID " +
              "was not set when this build was created. Add it in your host's " +
              "Environment Variables (Vercel → Settings → Environment Variables) " +
              "and redeploy."
          );
          return;
        }
        if (!ready) return;
        login();
        onAction?.();
      }}
      aria-busy={PRIVY_CONFIGURED && !ready}
      title={
        PRIVY_CONFIGURED
          ? undefined
          : "Login unavailable: NEXT_PUBLIC_PRIVY_APP_ID is not configured on this deployment."
      }
      className={cn(
        "flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full bg-[#16181d] text-white border border-white/10 hover:bg-[#23262d] hover:shadow-glow-indigo transition-all duration-200",
        fullWidth ? "w-full py-3" : ""
      )}
    >
      <Wallet className={cn("w-4 h-4", PRIVY_CONFIGURED && !ready && "animate-pulse")} />
      Log In
    </motion.button>
  );
}
