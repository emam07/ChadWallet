"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { LogOut, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

interface AuthButtonProps {
  fullWidth?: boolean;
  /** Called after a login/logout action is triggered (e.g. to close a mobile menu). */
  onAction?: () => void;
}

export function AuthButton({ fullWidth, onAction }: AuthButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // The logged-out "Log In / Sign Up" button is the default for BOTH the
  // server render and the first client paint, so hydration matches. We only
  // swap to the account view once Privy is ready *and* authenticated. This
  // guarantees the Sign Up button is always visible even if the Privy SDK is
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
            "flex items-center gap-1.5 px-3 py-2 text-sm font-medium glass border border-white/10 rounded-lg text-white/80",
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
          className="flex items-center justify-center px-3 py-2 rounded-lg glass border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-all"
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
      // the icon) so users always see the Sign Up affordance.
      onClick={() => {
        if (!ready) return;
        login();
        onAction?.();
      }}
      aria-busy={!ready}
      className={cn(
        "flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold bg-accent-green text-black rounded-lg hover:bg-accent-green/90 hover:shadow-glow-green transition-all duration-200",
        fullWidth ? "w-full py-3" : ""
      )}
    >
      <Wallet className={cn("w-4 h-4", !ready && "animate-pulse")} />
      Log In / Sign Up
    </motion.button>
  );
}
