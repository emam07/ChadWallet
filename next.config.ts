import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.dexscreener.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "**.arweave.net" },
      { protocol: "https", hostname: "shdw-drive.genesysgo.net" },
    ],
  },
  webpack: (config) => {
    // Privy ships optional connectors (Stripe onramp, Farcaster mini-app) whose
    // peer deps we don't install because those login methods are disabled.
    // Resolve them to empty stubs so webpack doesn't emit "Module not found"
    // warnings or generate chunks that throw at runtime when Privy probes them.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stripe/crypto": false,
      "@farcaster/mini-app-solana": false,
    };

    // The Privy-heavy module graph is large (~12.7k modules), so the first dev
    // compile of a route can take over a minute. The browser only waits
    // `chunkLoadTimeout` (webpack default: 120s) for a chunk like
    // `app/layout.js`; if the server is still compiling when that elapses it
    // throws a runtime `ChunkLoadError`. Give slow cold compiles more headroom.
    // Harmless in production, where chunks are prebuilt and load instantly.
    config.output = config.output ?? {};
    config.output.chunkLoadTimeout = 600000;

    return config;
  },
};

export default nextConfig;
