import { NextResponse } from "next/server";
import { tokens as mockTokens } from "@/lib/data";
import { getTokenPairs } from "@/lib/dexscreener";
import { getTrendingTokens } from "@/lib/geckoterminal";
import { isValidSolanaAddress } from "@/lib/validation";
import { num } from "@/lib/num";

interface TokenRow {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  logoURI?: string;
  color?: string;
}

// Collapse rows that point at the same token, then the same symbol, keeping the
// highest-volume occurrence of each. Two upstreams can surface the same token
// (and bridged variants reuse a ticker like USDT), so de-duping by both address
// and symbol keeps the list clean. Result is ranked by 24h volume, descending.
function dedupeAndRank(rows: TokenRow[]): TokenRow[] {
  const byAddress = new Map<string, TokenRow>();
  for (const row of rows) {
    const key = row.address.toLowerCase();
    const existing = byAddress.get(key);
    if (!existing || row.volume > existing.volume) byAddress.set(key, row);
  }

  const bySymbol = new Map<string, TokenRow>();
  for (const row of byAddress.values()) {
    const key = row.symbol.toLowerCase();
    const existing = bySymbol.get(key);
    if (!existing || row.volume > existing.volume) bySymbol.set(key, row);
  }

  return Array.from(bySymbol.values()).sort((a, b) => b.volume - a.volume);
}

// Price the curated universe (lib/data.ts) via DexScreener. Returns live rows
// for whichever curated tokens DexScreener knows about; empty on failure.
async function getCuratedRows(): Promise<TokenRow[]> {
  const universe = Array.from(new Set(mockTokens.map((t) => t.address)));
  const pairs = await getTokenPairs(universe);
  if (!pairs.size) return [];

  return mockTokens
    .map((mock): TokenRow | null => {
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
    .filter((t): t is TokenRow => t !== null);
}

// Trade-page token list. We MERGE two live, key-less sources so the list stays
// long and stable instead of collapsing when one upstream is thin or rate-
// limited: GeckoTerminal's "top pools" ranking (real trending Solana tokens by
// 24h volume) plus the curated universe (lib/data.ts) priced via DexScreener.
// Both are fetched in parallel, merged, de-duped, and ranked by volume. If both
// upstreams fail we serve the static mock list, so the list always renders.
export async function GET() {
  const [trending, curated] = await Promise.all([
    getTrendingTokens(60),
    getCuratedRows(),
  ]);

  // Guard the route's address invariant even with live upstream data.
  const merged = dedupeAndRank(
    [...trending, ...curated].filter((t) => isValidSolanaAddress(t.address))
  );

  if (merged.length) return NextResponse.json({ tokens: merged });

  // Both upstreams failed → static mock fallback (de-duped + ranked).
  return NextResponse.json({ tokens: dedupeAndRank(mockTokens) });
}
