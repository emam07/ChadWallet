/**
 * Market-data integration tests — exercise the live path where routes call the
 * public DexScreener / GeckoTerminal APIs and map the response. (The other
 * api/*.test.ts files cover the no-network mock-fallback path.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_ADDRESS = 'So11111111111111111111111111111111111111112'; // SOL
const BONK_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

/** Queue one JSON response for the next fetch() call. */
function mockJsonOnce(body: unknown) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  });
}

function dexPair(over: Record<string, unknown> = {}) {
  return {
    chainId: 'solana',
    pairAddress: 'PAIR1',
    baseToken: { address: VALID_ADDRESS, name: 'Wrapped SOL', symbol: 'SOL' },
    quoteToken: { address: 'USDC', name: 'USD Coin', symbol: 'USDC' },
    priceUsd: '150.5',
    priceChange: { h24: 5.2 },
    volume: { h24: 1_000_000 },
    liquidity: { usd: 5_000_000 },
    marketCap: 80_000_000,
    info: { imageUrl: 'https://dd.dexscreener.com/sol.png' },
    ...over,
  };
}

vi.stubGlobal('fetch', vi.fn());

beforeEach(() => {
  vi.clearAllMocks();
});

describe('lib/dexscreener client', () => {
  it('returns the highest-liquidity Solana pair for a token', async () => {
    mockJsonOnce({
      pairs: [
        dexPair({ pairAddress: 'low', liquidity: { usd: 100 } }),
        dexPair({ pairAddress: 'high', liquidity: { usd: 999_999 } }),
        // non-Solana pair must be ignored
        dexPair({ chainId: 'ethereum', pairAddress: 'eth', liquidity: { usd: 10_000_000 } }),
      ],
    });
    const { getTokenPair } = await import('@/lib/dexscreener');
    const pair = await getTokenPair(VALID_ADDRESS);
    expect(pair?.pairAddress).toBe('high');
  });

  it('returns null on fetch failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const { getTokenPair } = await import('@/lib/dexscreener');
    expect(await getTokenPair(VALID_ADDRESS)).toBeNull();
  });

  it('returns null on non-2xx response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const { getTokenPair } = await import('@/lib/dexscreener');
    expect(await getTokenPair(VALID_ADDRESS)).toBeNull();
  });

  it('maps batched pairs by lowercased token address', async () => {
    mockJsonOnce({
      pairs: [
        dexPair(),
        dexPair({
          baseToken: { address: BONK_ADDRESS, name: 'Bonk', symbol: 'BONK' },
          volume: { h24: 5_000_000 },
        }),
      ],
    });
    const { getTokenPairs } = await import('@/lib/dexscreener');
    const map = await getTokenPairs([VALID_ADDRESS, BONK_ADDRESS]);
    expect(map.get(VALID_ADDRESS.toLowerCase())?.baseToken.symbol).toBe('SOL');
    expect(map.get(BONK_ADDRESS.toLowerCase())?.baseToken.symbol).toBe('BONK');
  });
});

describe('lib/geckoterminal client', () => {
  it('resolves the top pool address for a token', async () => {
    mockJsonOnce({ data: [{ attributes: { address: 'POOL_TOP' } }, { attributes: { address: 'POOL2' } }] });
    const { getTopPoolAddress } = await import('@/lib/geckoterminal');
    expect(await getTopPoolAddress(VALID_ADDRESS)).toBe('POOL_TOP');
  });

  it('zips and sorts ohlcv_list ascending by time', async () => {
    mockJsonOnce({
      data: {
        attributes: {
          // returned newest-first
          ohlcv_list: [
            [300, 3, 3.5, 2.5, 3.2, 3000],
            [200, 2, 2.5, 1.5, 2.2, 2000],
            [100, 1, 1.5, 0.5, 1.2, 1000],
          ],
        },
      },
    });
    const { getPoolOhlcv } = await import('@/lib/geckoterminal');
    const candles = await getPoolOhlcv('POOL', { timeframe: 'minute', aggregate: 15 });
    expect(candles).toHaveLength(3);
    expect(candles[0]).toEqual({ time: 100, open: 1, high: 1.5, low: 0.5, close: 1.2, volume: 1000 });
    expect(candles[2].time).toBe(300);
  });

  it('maps pool trades and drops invalid rows', async () => {
    mockJsonOnce({
      data: [
        {
          attributes: {
            kind: 'buy',
            tx_hash: 'sig1',
            tx_from_address: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456',
            to_token_amount: '400',
            from_token_amount: '1',
            price_to_in_usd: '1.25',
            volume_in_usd: '500',
            block_timestamp: '2026-06-24T00:00:00Z',
          },
        },
        // invalid: zero price → dropped
        {
          attributes: {
            kind: 'sell', tx_hash: 'sig2', tx_from_address: 'x',
            from_token_amount: '10', price_from_in_usd: '0',
            volume_in_usd: '0', block_timestamp: '2026-06-24T00:01:00Z',
          },
        },
      ],
    });
    const { getPoolTrades } = await import('@/lib/geckoterminal');
    const trades = await getPoolTrades('POOL');
    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({ kind: 'buy', txHash: 'sig1', tokenAmount: 400, priceUsd: 1.25, valueUsd: 500 });
  });
});

describe('GET /api/tokens (DexScreener path)', () => {
  it('maps pairs, passes through 24h percent, and ranks by volume', async () => {
    mockJsonOnce({
      pairs: [
        dexPair({ priceUsd: '150.5', priceChange: { h24: 5.2 }, volume: { h24: 1_000_000 } }),
        dexPair({
          baseToken: { address: BONK_ADDRESS, name: 'Bonk', symbol: 'BONK' },
          priceUsd: '0.00002', priceChange: { h24: 12.34 }, volume: { h24: 9_000_000 },
        }),
      ],
    });
    const { GET } = await import('@/app/api/tokens/route');
    const data = await (await GET()).json();
    // ranked by volume DESC → BONK first
    expect(data.tokens[0].symbol).toBe('BONK');
    expect(data.tokens[0].change).toBeCloseTo(12.34);
    expect(data.tokens[1].symbol).toBe('SOL');
    expect(data.tokens[1].price).toBe(150.5);
  });

  it('falls back to mock tokens when DexScreener returns no pairs', async () => {
    mockJsonOnce({ pairs: [] });
    const { GET } = await import('@/app/api/tokens/route');
    const data = await (await GET()).json();
    expect(data.tokens.length).toBeGreaterThan(0);
  });
});

describe('GET /api/token/[address] (DexScreener path)', () => {
  it('maps a single token overview to the UI shape', async () => {
    mockJsonOnce({ pairs: [dexPair({ priceUsd: '2.5', priceChange: { h24: -5 }, volume: { h24: 900_000 }, marketCap: 4_000_000 })] });
    const { GET } = await import('@/app/api/token/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/token/${VALID_ADDRESS}`), params(VALID_ADDRESS))).json();
    expect(data.token.symbol).toBe('SOL');
    expect(data.token.price).toBe(2.5);
    expect(data.token.priceChange24hPercent).toBeCloseTo(-5);
    expect(data.token.mc).toBe(4_000_000);
  });
});

describe('GET /api/trades/[address] (GeckoTerminal path)', () => {
  it('resolves the pool then maps trades', async () => {
    mockJsonOnce({ data: [{ attributes: { address: 'POOL' } }] }); // getTopPoolAddress
    mockJsonOnce({
      data: [
        {
          attributes: {
            kind: 'buy', tx_hash: 'sig1', tx_from_address: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456',
            to_token_amount: '400', price_to_in_usd: '1.25', volume_in_usd: '500',
            block_timestamp: '2026-06-24T00:00:00Z',
          },
        },
      ],
    });
    const { GET } = await import('@/app/api/trades/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS))).json();
    expect(data.trades).toHaveLength(1);
    expect(data.trades[0].type).toBe('buy');
    expect(data.trades[0].txHash).toBe('sig1');
    expect(data.trades[0].amount).toBe(400);
    expect(data.trades[0].wallet).toBe('AbCd...3456');
  });
});

describe('GET /api/ohlcv/[address] (GeckoTerminal path)', () => {
  it('resolves the pool then returns candles', async () => {
    mockJsonOnce({ data: [{ attributes: { address: 'POOL' } }] }); // getTopPoolAddress
    mockJsonOnce({
      data: { attributes: { ohlcv_list: [[200, 2, 2.5, 1.5, 2.2, 2000], [100, 1, 1.5, 0.5, 1.2, 1000]] } },
    });
    const { GET } = await import('@/app/api/ohlcv/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/ohlcv/${VALID_ADDRESS}?type=15m`), params(VALID_ADDRESS))).json();
    expect(data.candles).toHaveLength(2);
    expect(data.candles[0]).toEqual({ time: 100, open: 1, high: 1.5, low: 0.5, close: 1.2, volume: 1000 });
  });

  it('falls back to mock candles when the token has no pool', async () => {
    mockJsonOnce({ data: [] }); // no pool
    const { GET } = await import('@/app/api/ohlcv/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/ohlcv/${VALID_ADDRESS}?type=15m`), params(VALID_ADDRESS))).json();
    expect(data.candles.length).toBeGreaterThan(0);
  });
});
