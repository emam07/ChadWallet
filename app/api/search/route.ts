import { NextResponse } from "next/server";
import { searchTokens } from "@/lib/birdeye";
import { tokens as mockTokens } from "@/lib/data";
import { isValidSolanaAddress } from "@/lib/validation";

interface SearchRow {
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

// Token search via BirdEye's full token universe (not just the trending list).
// `?q=` is sanitized here (the route has no [address] segment, so middleware's
// address check doesn't cover it). Live BirdEye hits are merged with a local
// match over the curated list so very common tickers BirdEye's search filters
// out (e.g. "sol") still surface a result.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // Allowlist sanitize: keep only chars that appear in token names / symbols /
  // base58 addresses, dropping control chars, quotes, angle brackets, etc.
  // before the keyword ever reaches the upstream API. Then cap the length.
  const q = (searchParams.get("q") ?? "")
    .replace(/[^\w $.:-]/g, "")
    .trim()
    .slice(0, 64);

  if (q.length < 2) return NextResponse.json({ tokens: [] });

  const live = (await searchTokens(q, 30)).filter((t) => isValidSolanaAddress(t.address));

  // Local fallback/augment: fuzzy-match the curated mints by symbol or name.
  const lower = q.toLowerCase();
  const local: SearchRow[] = mockTokens
    .filter(
      (t) =>
        t.symbol.toLowerCase().includes(lower) ||
        t.name.toLowerCase().includes(lower) ||
        t.address.toLowerCase() === lower
    )
    .map((t) => ({
      symbol: t.symbol,
      name: t.name,
      address: t.address,
      price: t.price,
      change: t.change,
      volume: t.volume,
      marketCap: t.marketCap,
      color: t.color,
    }));

  // Live results first (richer + current), then any curated matches not already
  // present by address.
  const seen = new Set(live.map((t) => t.address.toLowerCase()));
  const merged: SearchRow[] = [...live];
  for (const t of local) {
    if (!seen.has(t.address.toLowerCase())) merged.push(t);
  }

  return NextResponse.json({ tokens: merged });
}
