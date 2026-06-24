import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimitStore, rateLimitStore, RATE_LIMIT_MAX } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('Basic behavior', () => {
    it('allows first request', () => {
      const result = checkRateLimit('1.2.3.4');
      expect(result.allowed).toBe(true);
    });

    it('returns correct limit constant', () => {
      const result = checkRateLimit('1.2.3.4');
      expect(result.limit).toBe(RATE_LIMIT_MAX);
    });

    it('decrements remaining counter', () => {
      const ip = '10.0.0.1';
      checkRateLimit(ip); // 1st
      checkRateLimit(ip); // 2nd
      const result = checkRateLimit(ip); // 3rd
      expect(result.remaining).toBe(RATE_LIMIT_MAX - 3);
    });

    it('returns a valid resetTime in the future', () => {
      const before = Date.now();
      const result = checkRateLimit('5.5.5.5');
      expect(result.resetTime).toBeGreaterThan(before);
    });
  });

  describe('Rate limit enforcement (DDoS protection)', () => {
    it(`allows exactly ${RATE_LIMIT_MAX} requests then blocks`, () => {
      const ip = '6.6.6.6';
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        expect(checkRateLimit(ip).allowed).toBe(true);
      }
      expect(checkRateLimit(ip).allowed).toBe(false);
    });

    it('sets remaining to 0 when blocked', () => {
      const ip = '7.7.7.7';
      for (let i = 0; i <= RATE_LIMIT_MAX; i++) checkRateLimit(ip);
      const result = checkRateLimit(ip);
      expect(result.remaining).toBe(0);
    });

    it('simulates DDoS: 500 rapid requests, only 100 allowed', () => {
      const ip = '8.8.8.8';
      let allowed = 0;
      let blocked = 0;
      for (let i = 0; i < 500; i++) {
        if (checkRateLimit(ip).allowed) allowed++;
        else blocked++;
      }
      expect(allowed).toBe(RATE_LIMIT_MAX);
      expect(blocked).toBe(500 - RATE_LIMIT_MAX);
    });
  });

  describe('IP isolation', () => {
    it('tracks different IPs independently', () => {
      const ip1 = '11.11.11.11';
      const ip2 = '22.22.22.22';

      // Exhaust ip1
      for (let i = 0; i <= RATE_LIMIT_MAX; i++) checkRateLimit(ip1);
      expect(checkRateLimit(ip1).allowed).toBe(false);

      // ip2 should still be allowed
      expect(checkRateLimit(ip2).allowed).toBe(true);
    });

    it('handles 1000 different IPs without cross-contamination', () => {
      for (let i = 0; i < 1000; i++) {
        const result = checkRateLimit(`192.168.${Math.floor(i / 256)}.${i % 256}`);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(RATE_LIMIT_MAX - 1);
      }
    });
  });

  describe('Window reset', () => {
    it('resets counter after window expires', () => {
      const ip = '33.33.33.33';

      // Exhaust the limit
      for (let i = 0; i <= RATE_LIMIT_MAX; i++) checkRateLimit(ip);
      expect(checkRateLimit(ip).allowed).toBe(false);

      // Expire the window by manipulating store
      const entry = rateLimitStore.get(ip);
      if (entry) {
        entry.resetTime = Date.now() - 1;
        rateLimitStore.set(ip, entry);
      }

      // Should be allowed again
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMIT_MAX - 1);
    });
  });

  describe('Store management', () => {
    it('resetRateLimitStore clears all entries', () => {
      checkRateLimit('44.44.44.44');
      checkRateLimit('55.55.55.55');
      expect(rateLimitStore.size).toBeGreaterThan(0);
      resetRateLimitStore();
      expect(rateLimitStore.size).toBe(0);
    });

    it('fresh store after reset allows full quota', () => {
      const ip = '66.66.66.66';
      for (let i = 0; i <= RATE_LIMIT_MAX; i++) checkRateLimit(ip);
      expect(checkRateLimit(ip).allowed).toBe(false);

      resetRateLimitStore();
      expect(checkRateLimit(ip).allowed).toBe(true);
    });
  });

  describe('Header values', () => {
    it('returns all required rate limit fields', () => {
      const result = checkRateLimit('77.77.77.77');
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.resetTime).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('remaining never goes below 0', () => {
      const ip = '88.88.88.88';
      for (let i = 0; i < 200; i++) checkRateLimit(ip);
      const result = checkRateLimit(ip);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });
});
