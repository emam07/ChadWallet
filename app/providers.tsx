"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId || appId === "your-privy-app-id-here") {
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
