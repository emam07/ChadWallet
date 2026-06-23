import { NextResponse } from "next/server";
import { tokens as mockTokens } from "@/lib/data";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

async function fetchBirdEye(path: string) {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey || apiKey === "your-birdeye-api-key-here") return null;

  try {
    const res = await fetch(`${BIRDEYE_BASE}${path}`, {
      headers: {
        "X-API-KEY": apiKey,
        "x-chain": "solana",
      },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const data = await fetchBirdEye(
    "/defi/v3/token/trending?sort_by=rank&sort_type=asc&offset=0&limit=20"
  );

  if (data?.data?.tokens) {
    const tokens = data.data.tokens.map((t: Record<string, unknown>) => ({
      symbol: t.symbol,
      name: t.name,
      address: t.address,
      price: t.price,
      change: t.priceChange24hPercent,
      volume: t.v24hUSD,
      marketCap: t.mc,
      logoURI: t.logoURI,
      color: "#00FFA3",
    }));
    return NextResponse.json({ tokens });
  }

  // Fallback to mock data
  return NextResponse.json({ tokens: mockTokens });
}
