import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/validation";
import { getTokenOverview } from "@/lib/birdeye";

// Single-token overview via BirdEye. Falls back to a neutral "unknown token"
// shape when BirdEye has no data (or no API key is configured).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  const overview = await getTokenOverview(address);
  if (overview) {
    return NextResponse.json({ token: overview });
  }

  return NextResponse.json({
    token: {
      address,
      symbol: "UNKNOWN",
      name: "Unknown Token",
      price: 0,
      priceChange24hPercent: 0,
      priceChange: { m5: 0, h1: 0, h6: 0, h24: 0 },
      v24hUSD: 0,
      liquidity: 0,
      mc: 0,
      txns24h: { buys: 0, sells: 0 },
      holder: 0,
      socials: [],
    },
  });
}
