"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId || appId === "your-privy-app-id-here") {
    // NEXT_PUBLIC_* vars are inlined at BUILD time. If this fires in a deployed
    // build it means the env var was not set on the host (e.g. Vercel) when the
    // app was built — Privy never mounts, so `login()` is a silent no-op and the
    // Google/Apple popup never opens even though the page renders fine (HTTP 200).
    if (typeof window !== "undefined") {
      console.error(
        "[ChadWallet] NEXT_PUBLIC_PRIVY_APP_ID is missing. Set it in your host's " +
          "environment variables (Vercel → Project → Settings → Environment Variables) " +
          "and redeploy. Login/Sign Up will not work until then."
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Each method listed here must also be enabled in the Privy
        // dashboard (Login methods) for the app id above. Apple is omitted
        // until Apple OAuth credentials are configured in the dashboard;
        // listing it here would render a sign-in button that always fails.
        loginMethods: ["email", "google"],
        appearance: {
          // Match the dark landing page: a dark modal with the gold brand accent
          // and the real (white, transparent) ChadWallet logo. The previous
          // config pointed at "/logo/light.png", which does not exist, so the
          // modal rendered a broken image — use the shipped "/logo/dark.png".
          theme: "dark",
          accentColor: "#f5c518",
          logo: "/logo/dark.png",
          walletChainType: "solana-only",
        },
        // Do NOT auto-provision an embedded wallet on login. The Privy app is
        // configured server-side as "user-controlled-server-wallets-only" with
        // Solana createOnLogin = "off"; requesting client-side creation here
        // ("users-without-wallets") conflicts with that and breaks the login
        // flow on HTTPS (the deployed site), while appearing to work over
        // plain-HTTP localhost. Keeping this "off" matches the dashboard, so
        // email/Google login completes cleanly. Wallet provisioning is wired in
        // as its own step once the app actually uses on-chain balances.
        embeddedWallets: {
          solana: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
