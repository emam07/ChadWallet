import { describe, it, expect } from 'vitest';
import {
  dedupeByTime,
  mergeTrendingPage,
  type Candle,
  type TrendingToken,
} from '@/lib/geckoterminal';

function candle(time: number, close: number): Candle {
  return { time, open: close, high: close, low: close, close, volume: 1 };
}

describe('dedupeByTime', () => {
  it('returns the input unchanged when all timestamps are unique', () => {
    const input = [candle(1, 10), candle(2, 20), candle(3, 30)];
    expect(dedupeByTime(input)).toEqual(input);
  });

  it('collapses repeated timestamps, keeping the last occurrence', () => {
    const input = [candle(1, 10), candle(2, 20), candle(2, 25), candle(3, 30)];
    const out = dedupeByTime(input);
    expect(out.map((c) => c.time)).toEqual([1, 2, 3]);
    // The duplicate at time=2 keeps the later (freshest) close.
    expect(out.find((c) => c.time === 2)?.close).toBe(25);
  });

  it('collapses runs of more than two duplicates', () => {
    const input = [candle(5, 1), candle(5, 2), candle(5, 3)];
    const out = dedupeByTime(input);
    expect(out).toHaveLength(1);
    expect(out[0].close).toBe(3);
  });

  it('produces strictly-ascending, unique timestamps (lightweight-charts invariant)', () => {
    const input = [candle(1, 1), candle(1, 1), candle(2, 2), candle(2, 2), candle(3, 3)];
    const out = dedupeByTime(input);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].time).toBeGreaterThan(out[i - 1].time);
    }
  });

  it('handles an empty array', () => {
    expect(dedupeByTime([])).toEqual([]);
  });
});

// A minimal top-pools page: one pool backed by one token. `overrides` patches
// the pool attributes; `tokenOverrides` patches the side-loaded token.
function poolPage(
  tokenId: string,
  poolAttrs: Record<string, unknown>,
  tokenAttrs: Record<string, unknown>
) {
  return {
    data: [
      {
        attributes: poolAttrs,
        relationships: { base_token: { data: { id: tokenId } } },
      },
    ],
    included: [{ id: tokenId, type: 'token', attributes: tokenAttrs }],
  };
}

describe('mergeTrendingPage', () => {
  const TOKEN_ID = 'solana_MintAddr1111111111111111111111111111111';

  it('parses a pool + side-loaded token into a TrendingToken row', () => {
    const map = new Map<string, TrendingToken>();
    mergeTrendingPage(
      poolPage(
        TOKEN_ID,
        {
          base_token_price_usd: '1.5',
          price_change_percentage: { h24: '12.5' },
          volume_usd: { h24: '1000000' },
          market_cap_usd: '5000000',
        },
        { address: 'MintAddr1', name: 'Test Token', symbol: 'TST', image_url: 'https://logo.png' }
      ),
      map
    );

    const row = map.get('mintaddr1');
    expect(row).toMatchObject({
      symbol: 'TST',
      name: 'Test Token',
      address: 'MintAddr1',
      price: 1.5,
      change: 12.5,
      volume: 1000000,
      marketCap: 5000000,
      logoURI: 'https://logo.png',
    });
  });

  it('drops the placeholder "missing.png" logo', () => {
    const map = new Map<string, TrendingToken>();
    mergeTrendingPage(
      poolPage(
        TOKEN_ID,
        { volume_usd: { h24: '1' } },
        { address: 'MintAddr1', symbol: 'TST', image_url: 'https://x/missing.png' }
      ),
      map
    );
    expect(map.get('mintaddr1')?.logoURI).toBeUndefined();
  });

  it('falls back to fdv when market_cap_usd is absent', () => {
    const map = new Map<string, TrendingToken>();
    mergeTrendingPage(
      poolPage(
        TOKEN_ID,
        { volume_usd: { h24: '1' }, market_cap_usd: null, fdv_usd: '777' },
        { address: 'MintAddr1', symbol: 'TST' }
      ),
      map
    );
    expect(map.get('mintaddr1')?.marketCap).toBe(777);
  });

  it('keeps the highest-volume pool when a token backs several', () => {
    const map = new Map<string, TrendingToken>();
    // Lower-volume pool first…
    mergeTrendingPage(
      poolPage(TOKEN_ID, { volume_usd: { h24: '100' }, base_token_price_usd: '1' }, { address: 'MintAddr1', symbol: 'TST' }),
      map
    );
    // …then a busier pool for the same token wins.
    mergeTrendingPage(
      poolPage(TOKEN_ID, { volume_usd: { h24: '999' }, base_token_price_usd: '2' }, { address: 'MintAddr1', symbol: 'TST' }),
      map
    );
    expect(map.get('mintaddr1')?.volume).toBe(999);
    expect(map.get('mintaddr1')?.price).toBe(2);
    expect(map.size).toBe(1);
  });

  it('ignores pools whose base token is not in the included side-load', () => {
    const map = new Map<string, TrendingToken>();
    mergeTrendingPage(
      {
        data: [{ attributes: { volume_usd: { h24: '1' } }, relationships: { base_token: { data: { id: 'solana_unknown' } } } }],
        included: [],
      },
      map
    );
    expect(map.size).toBe(0);
  });

  it('coerces missing numeric fields to 0 without throwing', () => {
    const map = new Map<string, TrendingToken>();
    mergeTrendingPage(poolPage(TOKEN_ID, {}, { address: 'MintAddr1', symbol: 'TST' }), map);
    expect(map.get('mintaddr1')).toMatchObject({ price: 0, change: 0, volume: 0, marketCap: 0 });
  });

  it('is a no-op for null / empty pages', () => {
    const map = new Map<string, TrendingToken>();
    mergeTrendingPage(null, map);
    mergeTrendingPage({ data: [] }, map);
    expect(map.size).toBe(0);
  });
});
