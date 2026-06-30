import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/validation";
import { getTokenOverview, type TokenOverview } from "@/lib/birdeye";
import { tokens as curatedTokens } from "@/lib/data";

// Build a TokenOverview from a curated mock token. Used only when BirdEye is
// unreachable for a *known* mint: we surface the curated symbol/name/price/
// volume/marketCap snapshot rather than a misleading all-zero "UNKNOWN" card.
// Fields we genuinely don't have offline (per-window changes, liquidity, txns,
// holders) stay at 0 so the UI renders them honestly (liquidity → "—").
function curatedFallback(address: string): TokenOverview | null {
  const t = curatedTokens.find((tok) => tok.address === address);
  if (!t) return null;
  return {
    address,
    symbol: t.symbol,
    name: t.name,
    price: t.price,
    priceChange24hPercent: t.change,
    priceChange: { m5: 0, h1: 0, h6: 0, h24: t.change },
    v24hUSD: t.volume,
    liquidity: 0,
    mc: t.marketCap,
    txns24h: { buys: 0, sells: 0 },
    holder: 0,
    socials: [],
  };
}

// Single-token overview via BirdEye. When BirdEye has no data (or no API key is
// configured) we fall back to the curated snapshot for known mints, and only
// serve a neutral "unknown token" shape for addresses we truly know nothing
// about — so a transient API failure never blanks a known token to $0.00.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  const overview = (await getTokenOverview(address)) ?? curatedFallback(address);
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
