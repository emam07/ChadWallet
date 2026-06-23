import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.birdeye.so" },
      { protocol: "https", hostname: "birdeye-cdn.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "**.arweave.net" },
      { protocol: "https", hostname: "shdw-drive.genesysgo.net" },
    ],
  },
};

export default nextConfig;
