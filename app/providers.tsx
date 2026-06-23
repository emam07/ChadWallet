"use client";

// import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  // const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // if (!appId || appId === "your-privy-app-id-here") {
  //   return <>{children}</>;
  // }

  // return (
  //   <PrivyProvider
  //     appId={appId}
  //     config={{
  //       loginMethods: ["email", "google", "apple"],
  //       appearance: {
  //         theme: "dark",
  //         accentColor: "#00FFA3",
  //         logo: "/logo/dark.png",
  //       },
  //       embeddedWallets: {
  //         createOnLogin: "users-without-wallets",
  //       },
  //       solanaClusters: [
  //         {
  //           name: "mainnet-beta",
  //           rpcUrl:
  //             process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
  //             "https://api.mainnet-beta.solana.com",
  //         },
  //       ],
  //     }}
  //   >
  //     {children}
  //   </PrivyProvider>
  // );

  return <>{children}</>;
}
