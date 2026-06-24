/**
 * CORS and information disclosure tests — OWASP A05 / A01.
 * Tests that API endpoints don't leak sensitive data through headers or bodies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getTokens } from '@/app/api/tokens/route';
import { GET as getToken }  from '@/app/api/token/[address]/route';

vi.stubGlobal('fetch', vi.fn());

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

describe('CORS & Information Disclosure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API key exposure prevention', () => {
    it('CODEX_API_KEY is not present in response body', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      const text = await res.text();
      expect(text).not.toContain('CODEX_API_KEY');
      expect(text).not.toContain(process.env.CODEX_API_KEY ?? 'MISSING_KEY');
    });

    it('Alchemy RPC URL is not present in response body', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      const text = await res.text();
      expect(text).not.toContain('NEXT_PUBLIC_ALCHEMY_RPC_URL');
      expect(text).not.toContain('alchemy.com/v2/');
    });

    it('Privy App ID not leaked in response body', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      const text = await res.text();
      expect(text).not.toContain('NEXT_PUBLIC_PRIVY_APP_ID');
    });
  });

  describe('Stack trace / implementation detail exposure', () => {
    it('error response does not include file paths', async () => {
      const res = await getToken(new Request('http://localhost/api/token/bad'), params('bad'));
      const text = await res.text();
      expect(text).not.toMatch(/\.ts:\d+/);
      expect(text).not.toMatch(/at\s+\w+\s+\(.*\)/); // stack trace pattern
      expect(text).not.toContain('node_modules');
    });

    it('error response does not include internal variable names', async () => {
      const res = await getToken(new Request('http://localhost/api/token/bad'), params('bad'));
      const text = await res.text();
      expect(text).not.toContain('dexFetch');
      expect(text).not.toContain('geckoFetch');
      expect(text).not.toContain('DEXSCREENER_API');
    });
  });

  describe('Sensitive header leakage', () => {
    it('X-API-KEY not present in response headers', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      expect(res.headers.get('x-api-key')).toBeNull();
      expect(res.headers.get('X-API-KEY')).toBeNull();
    });

    it('Authorization header not echoed back', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens', {
        headers: { Authorization: 'Bearer secret-token' },
      }));
      expect(res.headers.get('Authorization')).toBeNull();
    });
  });

  describe('Response structure safety', () => {
    it('/api/tokens returns only expected fields', async () => {
      const res = await getTokens(new Request('http://localhost/api/tokens'));
      const data = await res.json();
      expect(Object.keys(data)).toEqual(['tokens']);
    });

    it('/api/token/[address] returns only expected fields on success', async () => {
      const addr = 'So11111111111111111111111111111111111111112';
      const res = await getToken(new Request(`http://localhost/api/token/${addr}`), params(addr));
      const data = await res.json();
      // Should have 'token', not sensitive fields
      expect(data).toHaveProperty('token');
      expect(data).not.toHaveProperty('apiKey');
      expect(data).not.toHaveProperty('secret');
    });

    it('error response has only { error: string }', async () => {
      const res = await getToken(new Request('http://localhost/api/token/bad'), params('bad'));
      const data = await res.json();
      expect(Object.keys(data)).toEqual(['error']);
    });
  });

  describe('HTTP method safety (GET-only routes)', () => {
    it('/api/tokens only exports GET (no POST/PUT/DELETE)', async () => {
      const mod = await import('@/app/api/tokens/route');
      expect(mod.GET).toBeDefined();
      expect((mod as Record<string, unknown>).POST).toBeUndefined();
      expect((mod as Record<string, unknown>).PUT).toBeUndefined();
      expect((mod as Record<string, unknown>).DELETE).toBeUndefined();
      expect((mod as Record<string, unknown>).PATCH).toBeUndefined();
    });

    it('/api/token/[address] only exports GET', async () => {
      const mod = await import('@/app/api/token/[address]/route');
      expect(mod.GET).toBeDefined();
      expect((mod as Record<string, unknown>).POST).toBeUndefined();
      expect((mod as Record<string, unknown>).DELETE).toBeUndefined();
    });

    it('/api/ohlcv/[address] only exports GET', async () => {
      const mod = await import('@/app/api/ohlcv/[address]/route');
      expect(mod.GET).toBeDefined();
      expect((mod as Record<string, unknown>).POST).toBeUndefined();
      expect((mod as Record<string, unknown>).DELETE).toBeUndefined();
    });

    it('/api/trades/[address] only exports GET', async () => {
      const mod = await import('@/app/api/trades/[address]/route');
      expect(mod.GET).toBeDefined();
      expect((mod as Record<string, unknown>).POST).toBeUndefined();
      expect((mod as Record<string, unknown>).DELETE).toBeUndefined();
    });
  });
});
