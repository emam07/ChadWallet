/**
 * DDoS protection / rate limiting tests.
 * Verifies that the system can withstand high-frequency attacks.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { resetRateLimitStore, RATE_LIMIT_MAX } from '@/lib/rate-limit';

function req(ip: string) {
  return new NextRequest('http://localhost/api/tokens', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('DDoS Protection / Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('Basic rate limiting', () => {
    it(`allows exactly ${RATE_LIMIT_MAX} req/min per IP`, () => {
      const ip = '200.200.200.200';
      let allowed = 0;
      for (let i = 0; i < RATE_LIMIT_MAX + 50; i++) {
        const res = middleware(req(ip));
        if (res.status !== 429) allowed++;
      }
      expect(allowed).toBe(RATE_LIMIT_MAX);
    });

    it('returns 429 Too Many Requests when limit exceeded', () => {
      const ip = '201.201.201.201';
      for (let i = 0; i < RATE_LIMIT_MAX; i++) middleware(req(ip));
      expect(middleware(req(ip)).status).toBe(429);
    });

    it('response body on 429 is valid JSON with error field', async () => {
      const ip = '202.202.202.202';
      for (let i = 0; i < RATE_LIMIT_MAX; i++) middleware(req(ip));
      const res = middleware(req(ip));
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('IP isolation (horizontal scale readiness)', () => {
    it('100 different IPs all get full quota independently', () => {
      for (let i = 0; i < 100; i++) {
        const ip = `10.0.${Math.floor(i / 256)}.${i % 256}`;
        const res = middleware(new NextRequest('http://localhost/api/tokens', {
          headers: { 'x-forwarded-for': ip },
        }));
        expect(res.status).not.toBe(429);
      }
    });

    it('blocking one IP does not block another', () => {
      const evil = '100.100.100.100';
      const legit = '200.200.200.201';

      // Exhaust evil IP
      for (let i = 0; i <= RATE_LIMIT_MAX; i++) {
        middleware(new NextRequest('http://localhost/api/tokens', {
          headers: { 'x-forwarded-for': evil },
        }));
      }
      expect(middleware(new NextRequest('http://localhost/api/tokens', {
        headers: { 'x-forwarded-for': evil },
      })).status).toBe(429);

      // Legit IP still works
      expect(middleware(new NextRequest('http://localhost/api/tokens', {
        headers: { 'x-forwarded-for': legit },
      })).status).not.toBe(429);
    });
  });

  describe('Amplification attack simulation', () => {
    it('1000 requests from same IP — only first 100 succeed', () => {
      const ip = '150.150.150.150';
      let success = 0;
      let blocked = 0;
      for (let i = 0; i < 1000; i++) {
        const status = middleware(req(ip)).status;
        if (status === 429) blocked++;
        else success++;
      }
      expect(success).toBe(RATE_LIMIT_MAX);
      expect(blocked).toBe(1000 - RATE_LIMIT_MAX);
    });
  });

  describe('Rate limit response headers', () => {
    it('includes X-RateLimit-Remaining that decrements', () => {
      const ip = '250.250.250.250';
      const r1 = middleware(req(ip));
      const r2 = middleware(req(ip));
      const rem1 = parseInt(r1.headers.get('X-RateLimit-Remaining') ?? '0');
      const rem2 = parseInt(r2.headers.get('X-RateLimit-Remaining') ?? '0');
      expect(rem2).toBe(rem1 - 1);
    });

    it('Retry-After is present and > 0 on 429', () => {
      const ip = '251.251.251.251';
      for (let i = 0; i < RATE_LIMIT_MAX; i++) middleware(req(ip));
      const res = middleware(req(ip));
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0');
      expect(retryAfter).toBeGreaterThan(0);
    });

    it('X-RateLimit-Limit is always present on success', () => {
      const res = middleware(req('252.252.252.252'));
      expect(res.headers.get('X-RateLimit-Limit')).toBe(String(RATE_LIMIT_MAX));
    });
  });

  describe('Distributed attack across routes', () => {
    it('rate limit applies across all API routes for same IP', () => {
      const ip = '253.253.253.253';
      const urls = [
        'http://localhost/api/tokens',
        `http://localhost/api/token/So11111111111111111111111111111111111111112`,
        `http://localhost/api/ohlcv/So11111111111111111111111111111111111111112`,
        `http://localhost/api/trades/So11111111111111111111111111111111111111112`,
      ];

      let count = 0;
      let blocked = false;
      outer: for (let round = 0; round < 30; round++) {
        for (const url of urls) {
          const res = middleware(new NextRequest(url, { headers: { 'x-forwarded-for': ip } }));
          count++;
          if (res.status === 429) {
            blocked = true;
            break outer;
          }
        }
      }
      expect(blocked).toBe(true);
      expect(count).toBeLessThanOrEqual(RATE_LIMIT_MAX + 1);
    });
  });
});
