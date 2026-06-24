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
        // dashboard (Login methods) for the app id above.
        loginMethods: ["email", "google", "apple"],
        appearance: {
          theme: "dark",
          accentColor: "#00FFA3",
          logo: "/logo/dark.png",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
