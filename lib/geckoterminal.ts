// GeckoTerminal public API client.
//
// DexScreener has no public endpoint for OHLCV candles or per-swap trades, so
// those two routes use GeckoTerminal's free, key-less REST API instead. Both
// are pool-scoped, so we first resolve a token's most-liquid pool, then query
// candles / trades for that pool.
//
// Free tier is rate-limited (~30 req/min); data is real but can lag a little.
// Every helper degrades gracefully (returns null) so routes fall back to mock.

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
