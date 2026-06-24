import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { resetRateLimitStore } from '@/lib/rate-limit';

function makeReq(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe('middleware', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('Security headers on normal requests', () => {
    it('sets X-Content-Type-Options: nosniff', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('sets X-Frame-Options: DENY', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('sets X-XSS-Protection: 1; mode=block', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('sets Referrer-Policy', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('sets Strict-Transport-Security with preload', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      const hsts = res.headers.get('Strict-Transport-Security');
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('sets Content-Security-Policy', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      const csp = res.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
    });

    it('sets Permissions-Policy', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      const pp = res.headers.get('Permissions-Policy');
      expect(pp).toContain('camera=()');
      expect(pp).toContain('microphone=()');
      expect(pp).toContain('geolocation=()');
    });

    it('sets X-Permitted-Cross-Domain-Policies: none', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
    });

    it('sets X-DNS-Prefetch-Control: off', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-DNS-Prefetch-Control')).toBe('off');
    });
  });

  describe('Rate limit headers on normal requests', () => {
    it('includes X-RateLimit-Limit', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy();
    });

    it('includes X-RateLimit-Remaining', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    });

    it('includes X-RateLimit-Reset', () => {
      const res = middleware(makeReq('http://localhost/api/tokens'));
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });

  describe('Rate limiting enforcement', () => {
    it('allows first 100 requests from same IP', () => {
      const ip = '99.99.99.99';
      for (let i = 0; i < 100; i++) {
        const res = middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip }));
        expect(res.status).not.toBe(429);
      }
    });

    it('blocks the 101st request with 429', () => {
      const ip = '44.44.44.44';
      for (let i = 0; i < 100; i++) {
        middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip }));
      }
      const res = middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip }));
      expect(res.status).toBe(429);
    });

    it('429 response includes Retry-After header', () => {
      const ip = '55.55.55.55';
      for (let i = 0; i < 101; i++) {
        middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip }));
      }
      const res = middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip }));
      expect(res.headers.get('Retry-After')).toBeTruthy();
    });

    it('uses x-real-ip as fallback IP', () => {
      const ip = '66.66.66.66';
      for (let i = 0; i < 100; i++) {
        middleware(makeReq('http://localhost/api/tokens', { 'x-real-ip': ip }));
      }
      const res = middleware(makeReq('http://localhost/api/tokens', { 'x-real-ip': ip }));
      expect(res.status).toBe(429);
    });

    it('uses first IP from comma-separated x-forwarded-for', () => {
      const ip = '77.77.77.77';
      for (let i = 0; i < 100; i++) {
        middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': `${ip}, 10.0.0.1, 172.16.0.1` }));
      }
      const res = middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': `${ip}, 10.0.0.1` }));
      expect(res.status).toBe(429);
    });

    it('different IPs do not share rate limit buckets', () => {
      const ip1 = '11.22.33.44';
      const ip2 = '55.66.77.88';
      for (let i = 0; i < 101; i++) {
        middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip1 }));
      }
      const res = middleware(makeReq('http://localhost/api/tokens', { 'x-forwarded-for': ip2 }));
      expect(res.status).not.toBe(429);
    });
  });

  describe('Address validation in middleware', () => {
    const validAddr = 'So11111111111111111111111111111111111111112';

    it('allows valid address on /api/token/', () => {
      const res = middleware(makeReq(`http://localhost/api/token/${validAddr}`));
      expect(res.status).not.toBe(400);
    });

    it('allows valid address on /api/ohlcv/', () => {
      const res = middleware(makeReq(`http://localhost/api/ohlcv/${validAddr}`));
      expect(res.status).not.toBe(400);
    });

    it('allows valid address on /api/trades/', () => {
      const res = middleware(makeReq(`http://localhost/api/trades/${validAddr}`));
      expect(res.status).not.toBe(400);
    });

    it('blocks SQL injection in /api/token/', () => {
      const res = middleware(makeReq("http://localhost/api/token/' OR 1=1--"));
      expect(res.status).toBe(400);
    });

    it('blocks XSS in /api/token/', () => {
      const res = middleware(makeReq('http://localhost/api/token/%3Cscript%3Ealert(1)%3C/script%3E'));
      expect(res.status).toBe(400);
    });

    it('blocks path traversal encoded in address segment', () => {
      // URL parsers normalize ../ sequences, so we test with a literal
      // address that contains traversal chars — validation rejects it
      const res = middleware(makeReq('http://localhost/api/ohlcv/%2e%2e%2fetc%2fpasswd'));
      expect(res.status).toBe(400);
    });
  });

  describe('Timeframe validation in middleware', () => {
    const validAddr = 'So11111111111111111111111111111111111111112';

    it('allows valid timeframe', () => {
      const res = middleware(makeReq(`http://localhost/api/ohlcv/${validAddr}?type=1H`));
      expect(res.status).not.toBe(400);
    });

    it('blocks invalid timeframe', () => {
      const res = middleware(makeReq(`http://localhost/api/ohlcv/${validAddr}?type=invalid`));
      expect(res.status).toBe(400);
    });

    it('blocks SQL in timeframe parameter', () => {
      const res = middleware(makeReq(`http://localhost/api/ohlcv/${validAddr}?type=1H'; DROP TABLE--`));
      expect(res.status).toBe(400);
    });
  });

  describe('Request size limits', () => {
    it('blocks requests with Content-Length > 100KB', () => {
      const res = middleware(makeReq('http://localhost/api/tokens', {
        'content-length': String(101 * 1024),
      }));
      expect(res.status).toBe(413);
    });

    it('allows requests with Content-Length <= 100KB', () => {
      const res = middleware(makeReq('http://localhost/api/tokens', {
        'content-length': String(100 * 1024),
      }));
      expect(res.status).not.toBe(413);
    });
  });
});
