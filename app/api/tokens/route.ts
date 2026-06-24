import { NextResponse } from "next/server";
import { tokens as mockTokens } from "@/lib/data";
import { getTokenPairs } from "@/lib/dexscreener";
import { num } from "@/lib/num";

// Trending Solana tokens. DexScreener has no public "trending" endpoint, so we
// price a curated universe of liquid Solana tokens (lib/data.ts) via DexScreener
// in one batched call and rank them by real 24h volume. Falls back to the static
// mock token list when DexScreener is unreachable.
export async function GET() {
  // Dedupe the curated universe (lib/data.ts has a couple of repeats).
  const universe = Array.from(new Set(mockTokens.map((t) => t.address)));

  const pairs = await getTokenPairs(universe);

  if (pairs.size) {
    const tokens = mockTokens
      .map((mock) => {
        const pair = pairs.get(mock.address.toLowerCase());
        if (!pair) return null;
        return {
          symbol: pair.baseToken.symbol || mock.symbol,
          name: pair.baseToken.name || mock.name,
          address: pair.baseToken.address,
          price: num(pair.priceUsd),
          // DexScreener priceChange.h24 is already a percent.
          change: num(pair.priceChange?.h24),
          volume: num(pair.volume?.h24),
          marketCap: num(pair.marketCap ?? pair.fdv),
          logoURI: pair.info?.imageUrl ?? undefined,
          color: mock.color,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      // Dedupe by address (curated list repeats some tokens) then rank by volume.
      .filter((t, i, arr) => arr.findIndex((x) => x.address === t.address) === i)
      .sort((a, b) => b.volume - a.volume);

    if (tokens.length) return NextResponse.json({ tokens });
  }

  // Fallback to mock data
  return NextResponse.json({ tokens: mockTokens });
}
