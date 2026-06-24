// DexScreener public API client.
//
// DexScreener exposes a free, key-less REST API for on-chain DEX market data.
// We use it for token overview + the trending list (price, 24h change, volume,
// liquidity, market cap, logo). It does NOT provide candles or per-swap trades —
// those come from GeckoTerminal (see lib/geckoterminal.ts).
//
// Every helper degrades gracefully: on any failure (network error, non-2xx,
// malformed body) it returns null/[] so each route can fall back to mock data
// and the UI always renders. No API key is required.

export const DEXSCREENER_API = "https://api.dexscreener.com";

// DexScreener chain id for Solana.
export const SOLANA_CHAIN_ID = "solana";

/** A single trading pair as returned by DexScreener. */
export interface DexPair {
  chainId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken?: { address: string; name: string; symbol: string };
  priceUsd?: string | null;
  priceChange?: { h24?: number | null } | null;
  volume?: { h24?: number | null } | null;
  liquidity?: { usd?: number | null } | null;
  marketCap?: number | null;
  fdv?: number | null;
  info?: { imageUrl?: string | null } | null;
}

interface TokensResponse {
  pairs?: DexPair[] | null;
}

/**
 * GET a DexScreener endpoint and return the parsed body, or null on any
 * failure. Never throws — callers branch on null to use mock data.
 */
async function dexFetch<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${DEXSCREENER_API}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Solana-only pairs, highest-liquidity pair first. */
function solanaPairs(pairs: DexPair[] | null | undefined): DexPair[] {
  if (!pairs?.length) return [];
  return pairs
    .filter((p) => p.chainId === SOLANA_CHAIN_ID && p.baseToken?.address)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
}

/**
 * Fetch the most-liquid Solana pair for a single token address.
 * Returns null when DexScreener has no data (→ caller uses mock).
 */
export async function getTokenPair(address: string): Promise<DexPair | null> {
  const data = await dexFetch<TokensResponse>(
    `/latest/dex/tokens/${address}`,
    10
  );
  return solanaPairs(data?.pairs)[0] ?? null;
}

/**
 * Fetch the most-liquid Solana pair for each of up to 30 token addresses.
 * Returns a map keyed by lowercased token address. Empty map on failure.
 */
export async function getTokenPairs(
  addresses: string[]
): Promise<Map<string, DexPair>> {
  const batch = addresses.slice(0, 30).join(",");
  const data = await dexFetch<TokensResponse>(
    `/latest/dex/tokens/${batch}`,
    30
  );

  const best = new Map<string, DexPair>();
  for (const pair of solanaPairs(data?.pairs)) {
    const key = pair.baseToken.address.toLowerCase();
    // solanaPairs is sorted by liquidity DESC, so the first one wins.
    if (!best.has(key)) best.set(key, pair);
  }
  return best;
}
