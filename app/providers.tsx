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

  // Privy embedded wallets require a secure context (HTTPS, or localhost/
  // 127.0.0.1 which browsers treat as secure). Opening the dev server over a
  // LAN IP (http://192.168.x.x:3000) is NOT a secure context, so provisioning
  // a wallet throws "Embedded wallet is only available over HTTPS". Gate
  // creation on isSecureContext so auth still works (login only) over plain
  // HTTP; embedded wallets activate automatically once served securely.
  const secureContext =
    typeof window === "undefined" ? true : window.isSecureContext;

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
          theme: "dark",
          accentColor: "#00FFA3",
          logo: "/logo/dark.png",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: secureContext ? "users-without-wallets" : "off",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
