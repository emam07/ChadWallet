import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/tokens/route';

vi.stubGlobal('fetch', vi.fn());

describe('GET /api/tokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with tokens array', async () => {
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  it('returns { tokens: [...] } structure', async () => {
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toHaveProperty('tokens');
    expect(Array.isArray(data.tokens)).toBe(true);
  });

  it('falls back to mock data when no API key configured', async () => {
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const data = await response.json();
    expect(data.tokens.length).toBeGreaterThan(0);
  });

  it('mock token has required fields', async () => {
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const data = await response.json();
    const token = data.tokens[0];
    expect(token).toHaveProperty('symbol');
    expect(token).toHaveProperty('address');
    expect(token).toHaveProperty('price');
    expect(typeof token.symbol).toBe('string');
    expect(typeof token.address).toBe('string');
    expect(typeof token.price).toBe('number');
  });

  it('sets Content-Type: application/json', async () => {
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('does not expose internal secrets in response body', async () => {
    // Even if fetch throws with a message containing env var names
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('CODEX_API_KEY=sk-secret connection refused')
    );
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const text = await response.text();
    expect(text).not.toContain('CODEX_API_KEY');
    expect(text).not.toContain('sk-secret');
  });

  it('does not expose stack traces in response body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Internal error at /lib/secret.ts:42')
    );
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const text = await response.text();
    // Stack traces look like: "at functionName (/path/to/file.ts:42:5)"
    expect(text).not.toMatch(/\.ts:\d+/);
    expect(text).not.toMatch(/at\s+\w+\s+\(.*:\d+:\d+\)/);
  });

  it('returns same structure whether API key set or not', async () => {
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toHaveProperty('tokens');
    expect(Array.isArray(data.tokens)).toBe(true);
  });

  it('all returned addresses pass Solana address validation', async () => {
    const { isValidSolanaAddress } = await import('@/lib/validation');
    const req = new Request('http://localhost:3000/api/tokens');
    const response = await GET(req);
    const data = await response.json();
    for (const token of data.tokens) {
      expect(isValidSolanaAddress(token.address)).toBe(true);
    }
  });
});
