// BirdEye API client.
//
// BirdEye (https://birdeye.so/data-api) is the single market-data source for the
// app: token overview, trending tokens, OHLCV candles, and live swaps — all
// Solana, all from one keyed REST API. Set BIRDEYE_API_KEY in .env.local.
//
// Every helper degrades gracefully: on a missing key, network error, non-2xx,
// or malformed body it returns null/[] so each route can fall back to mock data
// and the UI always renders.

import { num } from "@/lib/num";

export const BIRDEYE_API = "https://public-api.birdeye.so";

// .env.local ships with this sentinel; treat it as "no key configured".
const PLACEHOLDER_KEY = "your-birdeye-api-key-here";

/**
 * GET a BirdEye endpoint and return the parsed body, or null on any failure
 * (including a missing/placeholder API key). Never throws — callers branch on
 * null to use mock data. All requests are Solana-scoped via the `x-chain` header.
 */
async function birdeyeFetch<T>(path: string, revalidate: number): Promise<T | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey || apiKey === PLACEHOLDER_KEY) return null;

  try {
    const res = await fetch(`${BIRDEYE_API}${path}`, {
      headers: {
        "X-API-KEY": apiKey,
        "x-chain": "solana",
        Accept: "application/json",
      },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Token overview ───────────────────────────────────────────────────────────

/** Single-token overview shaped exactly as the trade page + swap panel consume. */
export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24hPercent: number;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  v24hUSD: number;
  liquidity: number;
  mc: number;
  txns24h: { buys: number; sells: number };
  holder: number;
  logoURI?: string;
  website?: string;
  socials: { type: string; url: string }[];
}

interface OverviewResponse {
  data?: Record<string, unknown> | null;
}

/**
 * Turn BirdEye's `extensions` object into the website + socials the token header
 * renders. BirdEye exposes each link as a flat string field (twitter, telegram…).
 */
function parseExtensions(ext: unknown): {
  website?: string;
  socials: { type: string; url: string }[];
} {
  const e = (ext ?? {}) as Record<string, unknown>;
  const website = typeof e.website === "string" && e.website ? e.website : undefined;
  const socials: { type: string; url: string }[] = [];
  for (const type of ["twitter", "telegram", "discord", "medium"] as const) {
    const url = e[type];
    if (typeof url === "string" && url) socials.push({ type, url });
  }
  return { website, socials };
}

/**
 * Fetch a token's overview. Returns null when BirdEye has no data or no key is
 * configured (→ caller serves a neutral "unknown token" shape).
 */
export async function getTokenOverview(address: string): Promise<TokenOverview | null> {
  const res = await birdeyeFetch<OverviewResponse>(
    `/defi/v3/token/overview?address=${address}`,
    10
  );
  const d = res?.data;
  if (!d) return null;

  const { website, socials } = parseExtensions(d.extensions);
  return {
    address,
    symbol: (d.symbol as string) || "UNKNOWN",
    name: (d.name as string) || "Unknown Token",
    price: num(d.price),
    priceChange24hPercent: num(d.priceChange24hPercent),
    // BirdEye has no 5m bucket; 30m is the closest short window for the "5M" chip.
    priceChange: {
      m5: num(d.priceChange30mPercent),
      h1: num(d.priceChange1hPercent),
      h6: num(d.priceChange6hPercent),
      h24: num(d.priceChange24hPercent),
    },
    v24hUSD: num(d.v24hUSD),
    liquidity: num(d.liquidity),
    mc: num(d.marketCap ?? d.mc ?? d.fdv),
    // 24h buy/sell transaction counts → swap-panel pressure bar.
    txns24h: { buys: num(d.buy24h), sells: num(d.sell24h) },
    holder: num(d.holder),
    logoURI: (d.logoURI as string) || undefined,
    website,
    socials,
  };
}

// ── Trending tokens ──────────────────────────────────────────────────────────

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

interface TrendingResponse {
  data?: { tokens?: Array<Record<string, unknown>> | null } | null;
}

/** Map one raw BirdEye trending entry to a TrendingToken (tolerant of field aliases). */
function toTrendingToken(t: Record<string, unknown>): TrendingToken {
  return {
    symbol: (t.symbol as string) || "???",
    name: (t.name as string) || (t.symbol as string) || "Unknown",
    address: t.address as string,
    price: num(t.price),
    change: num(t.price24hChangePercent ?? t.priceChange24hPercent),
    volume: num(t.volume24hUSD ?? t.v24hUSD),
    marketCap: num(t.marketcap ?? t.mc ?? t.fdv),
    logoURI: (t.logoURI as string) || undefined,
  };
}

/**
 * Live trending Solana tokens, ranked by BirdEye's own rank. The trending
 * endpoint caps at 20 rows/request, so we page via `offset` until we have
 * `limit` tokens (or run out). Returns [] on total failure / no key configured
 * (→ caller falls back to the curated/mock list), never throws.
 */
export async function getTrendingTokens(limit = 50): Promise<TrendingToken[]> {
  const PAGE = 20; // BirdEye trending limit cap per request.
  const out: TrendingToken[] = [];

  for (let offset = 0; out.length < limit; offset += PAGE) {
    const res = await birdeyeFetch<TrendingResponse>(
      `/defi/v3/token/trending?sort_by=rank&sort_type=asc&offset=${offset}&limit=${PAGE}`,
      30
    );
    const rows = res?.data?.tokens;
    if (!rows?.length) break;

    for (const t of rows) {
      if (typeof t.address === "string") out.push(toTrendingToken(t));
    }
    if (rows.length < PAGE) break; // last page
  }

  return out.slice(0, limit);
}

// ── OHLCV candles ──────────────────────────────────────────────────────────

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface OhlcvResponse {
  data?: {
    items?: Array<{
      unixTime?: number | null;
      o?: number | null;
      h?: number | null;
      l?: number | null;
      c?: number | null;
      v?: number | null;
    }> | null;
  } | null;
}

/**
 * OHLCV candles for a token over the last 7 days at the given BirdEye `type`
 * (1m, 15m, 1H, 1D, …). Cleaned to finite values and ascending by time. Returns
 * [] when BirdEye has no data (→ caller uses mock candles).
 */
export async function getTokenOhlcv(address: string, type: string): Promise<Candle[]> {
  // Date.now is available in route handlers (server runtime), not in workflow scripts.
  const now = Math.floor(Date.now() / 1000);
  const from = now - 60 * 60 * 24 * 7; // 7 days

  const res = await birdeyeFetch<OhlcvResponse>(
    `/defi/ohlcv?address=${address}&type=${type}&time_from=${from}&time_to=${now}`,
    60
  );

  const items = res?.data?.items;
  if (!items?.length) return [];

  return items
    .map((it) => ({
      time: Number(it.unixTime),
      open: Number(it.o),
      high: Number(it.h),
      low: Number(it.l),
      close: Number(it.c),
      volume: Number(it.v),
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
}

// ── Trades ───────────────────────────────────────────────────────────────────

export interface TokenTrade {
  txHash: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
  value: number;
  maker: string | null;
  timestamp: number;
}

interface TradesResponse {
  data?: {
    items?: Array<Record<string, unknown>> | null;
  } | null;
}

/**
 * Recent swaps for a token. Returns [] when BirdEye has no data (→ caller uses
 * mock trades).
 */
export async function getTokenTrades(address: string): Promise<TokenTrade[]> {
  const res = await birdeyeFetch<TradesResponse>(
    `/defi/txs/token?address=${address}&tx_type=swap&offset=0&limit=50`,
    5
  );

  const items = res?.data?.items;
  if (!items?.length) return [];

  return items
    .map((t): TokenTrade => {
      const owner = typeof t.owner === "string" ? t.owner : null;
      const ts = num(t.blockUnixTime);
      return {
        txHash: (t.txHash as string) || "",
        type: t.side === "buy" ? "buy" : "sell",
        price: num(t.price),
        amount: num(t.tokenAmount),
        value: num(t.volumeUSD),
        maker: owner,
        timestamp: ts > 0 ? ts * 1000 : NaN,
      };
    })
    .filter(
      (t) =>
        t.txHash &&
        Number.isFinite(t.price) &&
        t.price > 0 &&
        Number.isFinite(t.timestamp)
    );
}
