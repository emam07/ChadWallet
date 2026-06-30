/**
 * Security headers tests — OWASP A05 (Security Misconfiguration).
 * All headers are set by middleware and protect against common web attacks.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { resetRateLimitStore } from '@/lib/rate-limit';

function req(url = 'http://localhost/api/tokens') {
  return new NextRequest(url);
}

describe('Security Headers (OWASP A05)', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('Clickjacking protection', () => {
    it('X-Frame-Options: DENY prevents embedding in iframes', () => {
      expect(middleware(req()).headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('CSP frame-ancestors: none prevents embedding (modern browsers)', () => {
      const csp = middleware(req()).headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe('MIME sniffing protection', () => {
    it('X-Content-Type-Options: nosniff prevents MIME type confusion', () => {
      expect(middleware(req()).headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('XSS filter (legacy browsers)', () => {
    it('X-XSS-Protection: 1; mode=block', () => {
      expect(middleware(req()).headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('HTTPS enforcement', () => {
    it('Strict-Transport-Security has max-age >= 1 year', () => {
      const hsts = middleware(req()).headers.get('Strict-Transport-Security') ?? '';
      const match = hsts.match(/max-age=(\d+)/);
      expect(match).toBeTruthy();
      expect(parseInt(match![1])).toBeGreaterThanOrEqual(31_536_000);
    });

    it('HSTS includes includeSubDomains', () => {
      expect(middleware(req()).headers.get('Strict-Transport-Security')).toContain('includeSubDomains');
    });

    it('HSTS includes preload (for HSTS preload list)', () => {
      expect(middleware(req()).headers.get('Strict-Transport-Security')).toContain('preload');
    });
  });

  describe('Content Security Policy', () => {
    let csp: string;
    beforeEach(() => {
      resetRateLimitStore();
      csp = middleware(req()).headers.get('Content-Security-Policy') ?? '';
    });

    it('CSP header is present', () => {
      expect(csp).toBeTruthy();
    });

    it("default-src 'self' restricts unknown sources", () => {
      expect(csp).toContain("default-src 'self'");
    });

    it('img-src whitelists only known image hosts', () => {
      expect(csp).toContain('img-src');
      expect(csp).not.toContain('img-src *');
    });

    it('connect-src whitelists only known API endpoints', () => {
      expect(csp).toContain('connect-src');
      expect(csp).toContain('https://public-api.birdeye.so');
    });

    it("base-uri 'self' prevents base tag injection", () => {
      expect(csp).toContain("base-uri 'self'");
    });

    it("form-action 'self' prevents form hijacking", () => {
      expect(csp).toContain("form-action 'self'");
    });
  });

  describe('Referrer policy', () => {
    it('Referrer-Policy: strict-origin-when-cross-origin', () => {
      expect(middleware(req()).headers.get('Referrer-Policy'))
        .toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Permissions policy', () => {
    it('disables camera access', () => {
      expect(middleware(req()).headers.get('Permissions-Policy')).toContain('camera=()');
    });

    it('disables microphone access', () => {
      expect(middleware(req()).headers.get('Permissions-Policy')).toContain('microphone=()');
    });

    it('disables geolocation access', () => {
      expect(middleware(req()).headers.get('Permissions-Policy')).toContain('geolocation=()');
    });

    it('disables payment access', () => {
      expect(middleware(req()).headers.get('Permissions-Policy')).toContain('payment=()');
    });
  });

  describe('Miscellaneous', () => {
    it('X-DNS-Prefetch-Control: off (privacy)', () => {
      expect(middleware(req()).headers.get('X-DNS-Prefetch-Control')).toBe('off');
    });

    it('X-Download-Options: noopen (IE file download protection)', () => {
      expect(middleware(req()).headers.get('X-Download-Options')).toBe('noopen');
    });

    it('X-Permitted-Cross-Domain-Policies: none (Flash/PDF cross-domain)', () => {
      expect(middleware(req()).headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
    });
  });

  describe('Headers on all route types', () => {
    const urls = [
      'http://localhost/',
      'http://localhost/trade/So11111111111111111111111111111111111111112',
      'http://localhost/api/tokens',
      'http://localhost/api/token/So11111111111111111111111111111111111111112',
    ];

    urls.forEach(url => {
      it(`security headers present on ${url}`, () => {
        resetRateLimitStore();
        const res = middleware(new NextRequest(url));
        // Only check if not a 400/429 (those return early)
        if (res.status === 200 || res.status === 307) {
          expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(res.headers.get('X-Frame-Options')).toBe('DENY');
        }
      });
    });
  });
});
