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
 * Low-level BirdEye request that preserves the HTTP status and the reason for a
 * failure. Most helpers only care about "did it work" and use `birdeyeFetch`
 * below; the holders helper needs the status to tell a plan-gated 401/403 apart
 * from a 429 rate limit or a network drop. Never throws.
 */
interface BirdeyeResult<T> {
  ok: boolean;
  /** HTTP status, or 0 for failures that never reached a response. */
  status: number;
  /** Set for the two non-HTTP failure modes so callers can differentiate them. */
  reason?: "no_key" | "network";
  data: T | null;
}

async function birdeyeRequest<T>(
  path: string,
  revalidate: number
): Promise<BirdeyeResult<T>> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey || apiKey === PLACEHOLDER_KEY) {
    return { ok: false, status: 0, reason: "no_key", data: null };
  }

  try {
    const res = await fetch(`${BIRDEYE_API}${path}`, {
      headers: {
        "X-API-KEY": apiKey,
        "x-chain": "solana",
        Accept: "application/json",
      },
      next: { revalidate },
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    return { ok: true, status: res.status, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 0, reason: "network", data: null };
  }
}

/**
 * GET a BirdEye endpoint and return the parsed body, or null on any failure
 * (including a missing/placeholder API key). Never throws — callers branch on
 * null to use mock data. All requests are Solana-scoped via the `x-chain` header.
 */
async function birdeyeFetch<T>(path: string, revalidate: number): Promise<T | null> {
  const res = await birdeyeRequest<T>(path, revalidate);
  return res.ok ? res.data : null;
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
  // v1 `/defi/token_overview` is the overview endpoint our API tier exposes —
  // the v3 path returns "Not found". It carries the full per-window price,
  // volume, txn and holder data the trade page + swap panel consume.
  const res = await birdeyeFetch<OverviewResponse>(
    `/defi/token_overview?address=${address}`,
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
    // token_overview exposes a real 5m bucket (priceChange5mPercent).
    priceChange: {
      m5: num(d.priceChange5mPercent),
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
 * Live trending Solana tokens, ranked by BirdEye's own rank. Uses the v1
 * `/defi/token_trending` endpoint (the v3 path returns "Not found"), paging via
 * `offset` until we have `limit` tokens (or run out / hit a rate limit, in which
 * case we return what we have so far). Returns [] on total failure / no key
 * configured (→ caller falls back to the curated/mock list), never throws.
 */
export async function getTrendingTokens(limit = 100): Promise<TrendingToken[]> {
  const PAGE = 50; // Rows per request (the endpoint accepts up to 50).
  const out: TrendingToken[] = [];

  for (let offset = 0; out.length < limit; offset += PAGE) {
    const res = await birdeyeFetch<TrendingResponse>(
      `/defi/token_trending?sort_by=rank&sort_type=asc&offset=${offset}&limit=${PAGE}`,
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

// ── Token search ─────────────────────────────────────────────────────────────

interface SearchResponse {
  data?: {
    items?: Array<{ type?: string; result?: Array<Record<string, unknown>> | null }> | null;
  } | null;
}

/** Map a BirdEye search hit (snake_case fields) to a TrendingToken. */
function toSearchToken(r: Record<string, unknown>): TrendingToken {
  return {
    symbol: (r.symbol as string) || "???",
    name: (r.name as string) || (r.symbol as string) || "Unknown",
    address: r.address as string,
    price: num(r.price),
    change: num(r.price_change_24h_percent),
    volume: num(r.volume_24h_usd),
    marketCap: num(r.market_cap ?? r.fdv),
    logoURI: (r.logo_uri as string) || (r.logoURI as string) || undefined,
  };
}

/**
 * Search tokens by name / symbol / address against BirdEye's full universe (not
 * just the trending list). Ranked by 24h volume. Returns [] on failure / no key
 * (→ caller can fall back to a local match), never throws.
 */
export async function searchTokens(keyword: string, limit = 30): Promise<TrendingToken[]> {
  const res = await birdeyeFetch<SearchResponse>(
    `/defi/v3/search?keyword=${encodeURIComponent(keyword)}&target=token&search_mode=fuzzy` +
      `&sort_by=volume_24h_usd&sort_type=desc&offset=0&limit=${limit}`,
    30
  );

  const items = res?.data?.items;
  if (!items?.length) return [];

  const out: TrendingToken[] = [];
  for (const it of items) {
    if (it.type !== "token" || !Array.isArray(it.result)) continue;
    for (const r of it.result) {
      if (typeof r.address === "string") out.push(toSearchToken(r));
    }
  }
  return out;
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
      // A swap has two legs (base/quote). The queried token is whichever leg's
      // address matches; its uiAmount is the token amount and tokenPrice its USD
      // price, so value = amount × price. (The raw item has no flat
      // price/amount/value fields — those were the old, broken mapping.)
      const base = t.base as Record<string, unknown> | undefined;
      const quote = t.quote as Record<string, unknown> | undefined;
      const tokenSide =
        base?.address === address ? base : quote?.address === address ? quote : base;
      const price = num(t.tokenPrice ?? tokenSide?.price);
      const amount = Math.abs(num(tokenSide?.uiAmount));
      return {
        txHash: (t.txHash as string) || "",
        type: t.side === "buy" ? "buy" : "sell",
        price,
        amount,
        value: amount * price,
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

// ── Holders ──────────────────────────────────────────────────────────────────

/** A single normalized holder row for the Holders tab. */
export interface TokenHolder {
  /** The SPL token account address holding the balance. */
  address: string;
  /** The wallet that owns that token account. */
  owner: string;
  /** Human-readable balance held (ui amount). */
  amount: number;
  /** Ownership as a % of the token's supply (0 when supply is unknown). */
  percentage: number;
  /** 1-based position in the ranking (largest holder first). */
  rank: number;
}

/**
 * Discriminated result of a holders lookup. getTokenHolders never throws;
 * callers branch on `status` to render the matching state. `"ok"` with an empty
 * array means BirdEye genuinely returned zero holders — that's distinct from the
 * failure statuses below, which the API route maps to specific HTTP codes.
 */
export type HoldersResult =
  | { status: "ok"; holders: TokenHolder[] }
  /** 401/403 or no key — the holder endpoint isn't on the current plan. */
  | { status: "unauthorized" }
  /** 429 — hit BirdEye's rate limit. */
  | { status: "rate_limited" }
  /** 2xx but the feature is off, or a non-holder-shaped body. */
  | { status: "unavailable" }
  /** Network drop or 5xx — transient, worth retrying. */
  | { status: "network_error" };

interface HoldersResponse {
  success?: boolean;
  data?: {
    items?: Array<Record<string, unknown>> | null;
  } | null;
}

/**
 * Circulating (or total) supply for a token, used to derive ownership %.
 * Reuses the overview endpoint; returns 0 when unavailable so percentages
 * degrade to "—" rather than showing a wrong number.
 */
async function getTokenSupply(address: string): Promise<number> {
  const res = await birdeyeFetch<{ data?: Record<string, unknown> | null }>(
    `/defi/token_overview?address=${address}`,
    30
  );
  const d = res?.data;
  if (!d) return 0;
  return num(d.circulatingSupply ?? d.supply ?? d.totalSupply);
}

/**
 * Top holders for a token via BirdEye's v3 holder-distribution endpoint (gated
 * to higher API tiers). Returns a discriminated result rather than []/null so
 * the UI can distinguish "no holders" from "plan doesn't cover this" / "rate
 * limited" / "network error". Ownership % is derived from the token's supply
 * (fetched concurrently) when the endpoint doesn't provide it.
 */
export async function getTokenHolders(
  address: string,
  limit = 100
): Promise<HoldersResult> {
  const [res, supply] = await Promise.all([
    birdeyeRequest<HoldersResponse>(
      `/defi/v3/token/holder?address=${address}&offset=0&limit=${limit}`,
      30
    ),
    getTokenSupply(address),
  ]);

  if (!res.ok) {
    if (res.reason === "network") return { status: "network_error" };
    if (res.reason === "no_key") return { status: "unauthorized" };
    if (res.status === 401 || res.status === 403) return { status: "unauthorized" };
    if (res.status === 429) return { status: "rate_limited" };
    if (res.status >= 500) return { status: "network_error" };
    return { status: "unavailable" };
  }

  // Some plans answer 200 with `{ success: false }` when the feature is off.
  if (res.data?.success === false) return { status: "unauthorized" };

  const items = res.data?.data?.items;
  if (!items) return { status: "unavailable" };

  const holders = items
    .map((h, i): TokenHolder => {
      const amount = num(h.ui_amount ?? h.uiAmount ?? h.amount);
      // Prefer a percentage from BirdEye if present; otherwise derive it.
      const pctRaw = h.percentage ?? h.percent;
      const percentage =
        pctRaw != null ? num(pctRaw) : supply > 0 ? (amount / supply) * 100 : 0;
      return {
        address: (h.token_account as string) || (h.address as string) || "",
        owner: (h.owner as string) || (h.wallet as string) || "",
        amount,
        percentage,
        rank: i + 1,
      };
    })
    // Keep only rows we can actually attribute to a wallet/account.
    .filter((h) => h.owner || h.address);

  return { status: "ok", holders };
}
