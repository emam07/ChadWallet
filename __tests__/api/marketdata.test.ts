/**
 * Market-data integration tests — exercise the live path where routes call the
 * BirdEye API and map the response. (The other api/*.test.ts files cover the
 * no-network mock-fallback path.)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

/** A BirdEye token-overview response (data envelope). */
function overview(over: Record<string, unknown> = {}) {
  return {
    data: {
      symbol: 'SOL',
      name: 'Wrapped SOL',
      price: 150.5,
      priceChange24hPercent: 5.2,
      priceChange30mPercent: 0.1,
      priceChange1hPercent: 0.5,
      priceChange6hPercent: 2,
      v24hUSD: 1_000_000,
      liquidity: 5_000_000,
      marketCap: 80_000_000,
      buy24h: 120,
      sell24h: 80,
      holder: 4321,
      logoURI: 'https://logo.birdeye.so/sol.png',
      extensions: { website: 'https://solana.com', twitter: 'https://twitter.com/solana' },
      ...over,
    },
  };
}

/** A BirdEye trending response (data.tokens). */
function trendingPage(rows: Array<Record<string, unknown>>) {
  return { data: { tokens: rows } };
}

function trendingRow(over: Record<string, unknown> = {}) {
  return {
    address: VALID_ADDRESS,
    symbol: 'SOL',
    name: 'Wrapped SOL',
    price: 150.5,
    price24hChangePercent: 5.2,
    volume24hUSD: 1_000_000,
    marketcap: 80_000_000,
    logoURI: 'https://logo.birdeye.so/sol.png',
    ...over,
  };
}

vi.stubGlobal('fetch', vi.fn());

beforeEach(() => {
  vi.clearAllMocks();
  // A non-placeholder key activates the live BirdEye path.
  vi.stubEnv('BIRDEYE_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('lib/birdeye client', () => {
  it('maps a token overview to the UI shape', async () => {
    mockJsonOnce(overview());
    const { getTokenOverview } = await import('@/lib/birdeye');
    const t = await getTokenOverview(VALID_ADDRESS);
    expect(t).toMatchObject({
      symbol: 'SOL',
      price: 150.5,
      priceChange24hPercent: 5.2,
      v24hUSD: 1_000_000,
      liquidity: 5_000_000,
      mc: 80_000_000,
      txns24h: { buys: 120, sells: 80 },
      holder: 4321,
      website: 'https://solana.com',
    });
    expect(t?.priceChange).toEqual({ m5: 0.1, h1: 0.5, h6: 2, h24: 5.2 });
    expect(t?.socials).toContainEqual({ type: 'twitter', url: 'https://twitter.com/solana' });
  });

  it('returns null on fetch failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const { getTokenOverview } = await import('@/lib/birdeye');
    expect(await getTokenOverview(VALID_ADDRESS)).toBeNull();
  });

  it('returns null on non-2xx response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const { getTokenOverview } = await import('@/lib/birdeye');
    expect(await getTokenOverview(VALID_ADDRESS)).toBeNull();
  });

  it('returns null (no fetch) when no API key is configured', async () => {
    vi.stubEnv('BIRDEYE_API_KEY', 'your-birdeye-api-key-here');
    const { getTokenOverview } = await import('@/lib/birdeye');
    expect(await getTokenOverview(VALID_ADDRESS)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('maps and sorts OHLCV items ascending by time', async () => {
    mockJsonOnce({
      data: {
        items: [
          { unixTime: 300, o: 3, h: 3.5, l: 2.5, c: 3.2, v: 3000 },
          { unixTime: 100, o: 1, h: 1.5, l: 0.5, c: 1.2, v: 1000 },
          { unixTime: 200, o: 2, h: 2.5, l: 1.5, c: 2.2, v: 2000 },
        ],
      },
    });
    const { getTokenOhlcv } = await import('@/lib/birdeye');
    const candles = await getTokenOhlcv(VALID_ADDRESS, '15m');
    expect(candles).toHaveLength(3);
    expect(candles[0]).toEqual({ time: 100, open: 1, high: 1.5, low: 0.5, close: 1.2, volume: 1000 });
    expect(candles[2].time).toBe(300);
  });

  it('maps trades and drops invalid rows', async () => {
    mockJsonOnce({
      data: {
        items: [
          {
            txHash: 'sig1', side: 'buy', price: 1.25, tokenAmount: 400,
            volumeUSD: 500, owner: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456', blockUnixTime: 1_700_000_000,
          },
          // invalid: zero price → dropped
          { txHash: 'sig2', side: 'sell', price: 0, tokenAmount: 10, volumeUSD: 0, owner: 'x', blockUnixTime: 1_700_000_060 },
        ],
      },
    });
    const { getTokenTrades } = await import('@/lib/birdeye');
    const trades = await getTokenTrades(VALID_ADDRESS);
    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({ type: 'buy', txHash: 'sig1', amount: 400, price: 1.25, value: 500 });
    expect(trades[0].timestamp).toBe(1_700_000_000 * 1000);
  });
});

describe('GET /api/tokens (BirdEye trending path)', () => {
  it('returns live trending tokens ranked by 24h volume', async () => {
    mockJsonOnce(
      trendingPage([
        trendingRow({ address: VALID_ADDRESS, symbol: 'SOL', volume24hUSD: 1_000_000, price: 150.5, price24hChangePercent: 5.2 }),
        trendingRow({ address: BONK_ADDRESS, symbol: 'BONK', name: 'Bonk', volume24hUSD: 9_000_000, price: 0.00002, price24hChangePercent: 12.34 }),
      ])
    );
    const { GET } = await import('@/app/api/tokens/route');
    const data = await (await GET()).json();
    // ranked by volume DESC → BONK first
    expect(data.tokens[0].symbol).toBe('BONK');
    expect(data.tokens[0].change).toBeCloseTo(12.34);
    expect(data.tokens[1].symbol).toBe('SOL');
    expect(data.tokens[1].price).toBe(150.5);
  });

  it('only returns addresses that pass Solana validation', async () => {
    const { isValidSolanaAddress } = await import('@/lib/validation');
    mockJsonOnce(
      trendingPage([
        trendingRow({ address: VALID_ADDRESS, symbol: 'SOL', volume24hUSD: 1_000_000 }),
        // garbage address must be filtered out
        trendingRow({ address: 'not a valid address!!', symbol: 'BAD', name: 'Bad', volume24hUSD: 5_000_000 }),
      ])
    );
    const { GET } = await import('@/app/api/tokens/route');
    const data = await (await GET()).json();
    for (const token of data.tokens) {
      expect(isValidSolanaAddress(token.address)).toBe(true);
    }
    expect(data.tokens.some((t: { symbol: string }) => t.symbol === 'BAD')).toBe(false);
  });

  it('falls back to mock tokens when BirdEye returns nothing', async () => {
    mockJsonOnce(trendingPage([])); // empty trending page
    const { GET } = await import('@/app/api/tokens/route');
    const data = await (await GET()).json();
    expect(data.tokens.length).toBeGreaterThan(0);
  });
});

describe('GET /api/token/[address] (BirdEye path)', () => {
  it('maps a single token overview to the UI shape', async () => {
    mockJsonOnce(overview({ price: 2.5, priceChange24hPercent: -5, v24hUSD: 900_000, marketCap: 4_000_000 }));
    const { GET } = await import('@/app/api/token/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/token/${VALID_ADDRESS}`), params(VALID_ADDRESS))).json();
    expect(data.token.symbol).toBe('SOL');
    expect(data.token.price).toBe(2.5);
    expect(data.token.priceChange24hPercent).toBeCloseTo(-5);
    expect(data.token.mc).toBe(4_000_000);
  });

  it('serves an unknown-token shape when BirdEye has no data', async () => {
    mockJsonOnce({ data: null });
    const { GET } = await import('@/app/api/token/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/token/${VALID_ADDRESS}`), params(VALID_ADDRESS))).json();
    expect(data.token.symbol).toBe('UNKNOWN');
  });
});

describe('GET /api/trades/[address] (BirdEye path)', () => {
  it('maps trades and shortens the wallet', async () => {
    mockJsonOnce({
      data: {
        items: [
          {
            txHash: 'sig1', side: 'buy', price: 1.25, tokenAmount: 400,
            volumeUSD: 500, owner: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456', blockUnixTime: 1_700_000_000,
          },
        ],
      },
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

describe('GET /api/ohlcv/[address] (BirdEye path)', () => {
  it('returns mapped candles', async () => {
    mockJsonOnce({
      data: {
        items: [
          { unixTime: 200, o: 2, h: 2.5, l: 1.5, c: 2.2, v: 2000 },
          { unixTime: 100, o: 1, h: 1.5, l: 0.5, c: 1.2, v: 1000 },
        ],
      },
    });
    const { GET } = await import('@/app/api/ohlcv/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/ohlcv/${VALID_ADDRESS}?type=15m`), params(VALID_ADDRESS))).json();
    expect(data.candles).toHaveLength(2);
    expect(data.candles[0]).toEqual({ time: 100, open: 1, high: 1.5, low: 0.5, close: 1.2, volume: 1000 });
  });

  it('falls back to mock candles when BirdEye has no data', async () => {
    mockJsonOnce({ data: { items: [] } });
    const { GET } = await import('@/app/api/ohlcv/[address]/route');
    const data = await (await GET(new Request(`http://localhost/api/ohlcv/${VALID_ADDRESS}?type=15m`), params(VALID_ADDRESS))).json();
    expect(data.candles.length).toBeGreaterThan(0);
  });
});
