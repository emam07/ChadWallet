import { NextResponse } from "next/server";
import { tokens as mockTokens } from "@/lib/data";
import { getTokenPairs } from "@/lib/dexscreener";
import { getTrendingTokens } from "@/lib/geckoterminal";
import { isValidSolanaAddress } from "@/lib/validation";
import { num } from "@/lib/num";

// Trade-page token list. Primary source is GeckoTerminal's live "top pools"
// ranking (real trending Solana tokens by 24h volume — Option B). If that is
// unreachable we price the curated universe (lib/data.ts) via DexScreener, and
// if that also fails we serve the static mock list. The list always renders.
export async function GET() {
  // 1) Live trending tokens from GeckoTerminal, ranked by 24h volume.
  const trending = await getTrendingTokens(50);
  // Guard the route's address invariant even with live upstream data.
  const liveTokens = trending.filter((t) => isValidSolanaAddress(t.address));
  if (liveTokens.length) return NextResponse.json({ tokens: liveTokens });

  // 2) Fallback: price the curated universe via DexScreener, rank by volume.
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

  // 3) Fallback to mock data.
  return NextResponse.json({ tokens: mockTokens });
}
