import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { Space_Grotesk, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// fomo.family-style typography: Space Grotesk for display headlines,
// Inter for body/UI. Exposed as CSS variables consumed by tailwind.config.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ChadWallet — Trade Solana Before Everyone Else",
  description:
    "Discover trending tokens, track whales, and execute trades instantly with ChadWallet. The fastest Solana trading wallet.",
  keywords: ["Solana", "crypto wallet", "trading", "DeFi", "memecoin", "Solana wallet"],
  icons: {
    icon: "/logo/dark.png",
    apple: "/logo/dark.png",
  },
  openGraph: {
    title: "ChadWallet — Trade Solana Before Everyone Else",
    description:
      "Discover trending tokens, track whales, and execute trades instantly with ChadWallet.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChadWallet — Trade Solana Before Everyone Else",
    description:
      "Discover trending tokens, track whales, and execute trades instantly with ChadWallet.",
    site: "@chadwallet",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-bg-primary text-ink antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
