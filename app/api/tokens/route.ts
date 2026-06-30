import { NextResponse } from "next/server";
import { tokens as mockTokens } from "@/lib/data";
import { getTrendingTokens } from "@/lib/birdeye";
import { isValidSolanaAddress } from "@/lib/validation";

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
// highest-volume occurrence of each. Bridged variants reuse a ticker like USDT,
// so de-duping by both address and symbol keeps the list clean. Result is ranked
// by 24h volume, descending.
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

// Trade-page token list, sourced from BirdEye's trending ranking (real trending
// Solana tokens). Rows are de-duped and ranked by 24h volume. If BirdEye is
// unavailable (or no key is configured) we serve the static mock list, so the
// list always renders.
export async function GET() {
  const trending = await getTrendingTokens(100);

  // Guard the route's address invariant even with live upstream data.
  const merged = dedupeAndRank(
    trending.filter((t) => isValidSolanaAddress(t.address))
  );

  if (merged.length) return NextResponse.json({ tokens: merged });

  // Upstream failed → static mock fallback (de-duped + ranked).
  return NextResponse.json({ tokens: dedupeAndRank(mockTokens) });
}
