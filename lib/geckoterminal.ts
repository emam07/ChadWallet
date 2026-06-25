// GeckoTerminal public API client.
//
// DexScreener has no public endpoint for OHLCV candles or per-swap trades, so
// those two routes use GeckoTerminal's free, key-less REST API instead. Both
// are pool-scoped, so we first resolve a token's most-liquid pool, then query
// candles / trades for that pool.
//
// Free tier is rate-limited (~30 req/min); data is real but can lag a little.
// Every helper degrades gracefully (returns null) so routes fall back to mock.

import { num } from "@/lib/num";

export const GECKOTERMINAL_API = "https://api.geckoterminal.com/api/v2";

// GeckoTerminal network slug for Solana.
export const SOLANA_NETWORK = "solana";

/** GeckoTerminal aggregate buckets: timeframe + aggregate count. */
export interface GeckoResolution {
  timeframe: "minute" | "hour" | "day";
  aggregate: number;
}

// Map the app's validated timeframes (lib/validation) to GeckoTerminal's
// supported (timeframe, aggregate) buckets. GeckoTerminal only supports
// minute {1,5,15}, hour {1,4,12}, day {1} — others collapse to the nearest.
export const RESOLUTION_MAP: Record<string, GeckoResolution> = {
  "1m": { timeframe: "minute", aggregate: 1 },
  "3m": { timeframe: "minute", aggregate: 1 },
  "5m": { timeframe: "minute", aggregate: 5 },
  "15m": { timeframe: "minute", aggregate: 15 },
  "30m": { timeframe: "minute", aggregate: 15 },
  "1H": { timeframe: "hour", aggregate: 1 },
  "2H": { timeframe: "hour", aggregate: 1 },
  "4H": { timeframe: "hour", aggregate: 4 },
  "6H": { timeframe: "hour", aggregate: 4 },
  "8H": { timeframe: "hour", aggregate: 4 },
  "12H": { timeframe: "hour", aggregate: 12 },
  "1D": { timeframe: "day", aggregate: 1 },
  "3D": { timeframe: "day", aggregate: 1 },
  "1W": { timeframe: "day", aggregate: 1 },
  "1M": { timeframe: "day", aggregate: 1 },
};

/**
 * GET a GeckoTerminal endpoint and return the parsed body, or null on any
 * failure. Never throws — callers branch on null to use mock data.
 */
async function geckoFetch<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${GECKOTERMINAL_API}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface PoolsResponse {
  data?: Array<{ attributes?: { address?: string | null } | null }> | null;
}

/**
 * Resolve a token's most-liquid pool address on Solana. GeckoTerminal returns
 * a token's pools ranked by liquidity, so the first entry is the best pool.
 */
export async function getTopPoolAddress(tokenAddress: string): Promise<string | null> {
  const data = await geckoFetch<PoolsResponse>(
    `/networks/${SOLANA_NETWORK}/tokens/${tokenAddress}/pools?page=1`,
    60
  );
  return data?.data?.[0]?.attributes?.address ?? null;
}

interface OhlcvResponse {
  data?: {
    attributes?: {
      // [timestamp(s), open, high, low, close, volume]
      ohlcv_list?: Array<[number, number, number, number, number, number]> | null;
    } | null;
  } | null;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * OHLCV candles for a pool, ascending by time and deduplicated by timestamp
 * (lightweight-charts asserts strictly-ascending, unique times). Returns []
 * when GeckoTerminal has no data (→ caller uses mock candles).
 */
export async function getPoolOhlcv(
  poolAddress: string,
  resolution: GeckoResolution
): Promise<Candle[]> {
  const { timeframe, aggregate } = resolution;
  const data = await geckoFetch<OhlcvResponse>(
    `/networks/${SOLANA_NETWORK}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=300`,
    60
  );

  const list = data?.data?.attributes?.ohlcv_list;
  if (!list?.length) return [];

  const cleaned = list
    .map(([time, open, high, low, close, volume]) => ({
      time,
      open,
      high,
      low,
      close,
      volume,
    }))
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    )
    .sort((a, b) => a.time - b.time);

  return dedupeByTime(cleaned);
}

/**
 * Collapse candles that share a timestamp, keeping the last occurrence. Input
 * must already be sorted ascending by time. GeckoTerminal occasionally returns
 * repeated timestamps at aggregation boundaries, which would otherwise trip
 * lightweight-charts' ascending-order assertion.
 */
export function dedupeByTime(sorted: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (const c of sorted) {
    const last = out[out.length - 1];
    if (last && last.time === c.time) {
      out[out.length - 1] = c;
    } else {
      out.push(c);
    }
  }
  return out;
}

interface TradesResponse {
  data?: Array<{
    attributes?: {
      kind?: string | null;
      tx_hash?: string | null;
      tx_from_address?: string | null;
      from_token_amount?: string | null;
      to_token_amount?: string | null;
      price_from_in_usd?: string | null;
      price_to_in_usd?: string | null;
      volume_in_usd?: string | null;
      block_timestamp?: string | null;
    } | null;
  }> | null;
}

export interface PoolTrade {
  kind: string;
  txHash: string;
  maker: string | null;
  tokenAmount: number;
  priceUsd: number;
  valueUsd: number;
  timestamp: number;
}

/**
 * Recent swaps for a pool. Returns [] when GeckoTerminal has no data
 * (→ caller uses mock trades).
 */
export async function getPoolTrades(poolAddress: string): Promise<PoolTrade[]> {
  const data = await geckoFetch<TradesResponse>(
    `/networks/${SOLANA_NETWORK}/pools/${poolAddress}/trades`,
    5
  );

  const items = data?.data;
  if (!items?.length) return [];

  return items
    .map((it) => {
      const a = it.attributes ?? {};
      const isBuy = a.kind === "buy";
      // On a buy the trader receives the base token (the "to" side); on a sell
      // they spend it (the "from" side). Price/amount follow that side.
      const tokenAmount = Math.abs(
        Number(isBuy ? a.to_token_amount : a.from_token_amount)
      );
      const priceUsd = Number(isBuy ? a.price_to_in_usd : a.price_from_in_usd);
      const ts = a.block_timestamp ? Date.parse(a.block_timestamp) : NaN;
      return {
        kind: isBuy ? "buy" : "sell",
        txHash: a.tx_hash ?? "",
        maker: a.tx_from_address ?? null,
        tokenAmount,
        priceUsd,
        valueUsd: Number(a.volume_in_usd),
        timestamp: ts,
      };
    })
    .filter(
      (t) =>
        t.txHash &&
        Number.isFinite(t.priceUsd) &&
        t.priceUsd > 0 &&
        Number.isFinite(t.tokenAmount) &&
        t.tokenAmount > 0 &&
        Number.isFinite(t.timestamp)
    );
}

// ── Trending tokens ──────────────────────────────────────────────────────────
//
// GeckoTerminal's "top pools" endpoint returns the network's most-active pools,
// already ranked. We page through it, resolve each pool's base token from the
// `included` side-load, dedupe to one row per token (keeping its busiest pool),
// and rank by real 24h volume. This is the live, key-less source of truth for
// the Trade page's token list (see app/api/tokens/route.ts).

/** A live token row for the trending list, shaped like lib/data Token. */
export interface TrendingToken {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  logoURI?: string;
}

interface PoolListResponse {
  data?: Array<{
    attributes?: {
      base_token_price_usd?: string | null;
      price_change_percentage?: { h24?: string | null } | null;
      volume_usd?: { h24?: string | null } | null;
      market_cap_usd?: string | null;
      fdv_usd?: string | null;
    } | null;
    relationships?: {
      base_token?: { data?: { id?: string | null } | null } | null;
    } | null;
  }> | null;
  included?: Array<{
    id?: string | null;
    type?: string | null;
    attributes?: {
      address?: string | null;
      name?: string | null;
      symbol?: string | null;
      image_url?: string | null;
    } | null;
  }> | null;
}

/** GeckoTerminal uses "missing.png" as a placeholder when a token has no logo. */
function cleanLogo(url: string | null | undefined): string | undefined {
  return url && !url.includes("missing") ? url : undefined;
}

/**
 * Parse one page of the top-pools response into token rows, merging into
 * `byAddress` (keyed by lowercased mint). A token can back several pools, so we
 * keep the row from its highest-volume pool. Exported for unit testing.
 */
export function mergeTrendingPage(
  data: PoolListResponse | null,
  byAddress: Map<string, TrendingToken>
): void {
  if (!data?.data?.length) return;

  // Index the side-loaded token metadata by GeckoTerminal id ("solana_<mint>").
  const meta = new Map<
    string,
    { address: string; name: string; symbol: string; logoURI?: string }
  >();
  for (const inc of data.included ?? []) {
    if (inc?.type !== "token" || !inc.id) continue;
    const a = inc.attributes ?? {};
    if (!a.address) continue;
    meta.set(inc.id, {
      address: a.address,
      name: a.name ?? a.symbol ?? "Unknown",
      symbol: a.symbol ?? "???",
      logoURI: cleanLogo(a.image_url),
    });
  }

  for (const pool of data.data) {
    const id = pool?.relationships?.base_token?.data?.id;
    if (!id) continue;
    const m = meta.get(id);
    if (!m) continue;

    const volume = num(pool.attributes?.volume_usd?.h24);
    const key = m.address.toLowerCase();
    const existing = byAddress.get(key);
    if (existing && existing.volume >= volume) continue;

    byAddress.set(key, {
      symbol: m.symbol,
      name: m.name,
      address: m.address,
      price: num(pool.attributes?.base_token_price_usd),
      change: num(pool.attributes?.price_change_percentage?.h24),
      volume,
      marketCap: num(pool.attributes?.market_cap_usd ?? pool.attributes?.fdv_usd),
      logoURI: m.logoURI,
    });
  }
}

/**
 * Live trending Solana tokens, ranked by 24h volume. Pages through the top-pools
 * endpoint until it has `limit` unique tokens (or runs out / hits the page cap),
 * then returns the top `limit`. Returns [] on total failure (→ caller falls back
 * to the curated/mock list), never throws.
 */
export async function getTrendingTokens(limit = 50): Promise<TrendingToken[]> {
  const maxPages = 5; // 20 pools/page; ~5 pages comfortably yields 50+ tokens.
  const byAddress = new Map<string, TrendingToken>();

  for (let page = 1; page <= maxPages && byAddress.size < limit; page++) {
    const data = await geckoFetch<PoolListResponse>(
      `/networks/${SOLANA_NETWORK}/pools?include=base_token&page=${page}&sort=h24_volume_usd_desc`,
      30
    );
    if (!data?.data?.length) break;
    mergeTrendingPage(data, byAddress);
  }

  return Array.from(byAddress.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}
