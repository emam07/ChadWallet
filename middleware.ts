import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';
import { isValidSolanaAddress, isValidTimeframe } from './lib/validation';

const ADDR_PREFIXES = ['/api/token/', '/api/ohlcv/', '/api/trades/'];

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    // Privy loads Cloudflare Turnstile (captcha) scripts.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.dexscreener.com https://*.amazonaws.com https://assets.coingecko.com https://coin-images.coingecko.com https://raw.githubusercontent.com https://*.arweave.net https://shdw-drive.genesysgo.net https://auth.privy.io https://explorer-api.walletconnect.com https://*.walletconnect.com",
    // Privy SDK calls auth.privy.io + its embedded-wallet RPCs, and the
    // bundled WalletConnect transport opens relay websockets. Without these
    // the SDK throws "Failed to fetch" and never reaches `ready`.
    "connect-src 'self' https://api.dexscreener.com https://api.geckoterminal.com https://api.mainnet-beta.solana.com https://quote-api.jup.ag https://station.jup.ag https://auth.privy.io https://*.privy.io https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org wss://www.walletlink.org",
    "font-src 'self' data:",
    // Privy renders its login modal + embedded wallet inside iframes.
    "frame-src 'self' https://auth.privy.io https://challenges.cloudflare.com https://verify.walletconnect.com https://verify.walletconnect.org",
    "child-src 'self' https://auth.privy.io https://challenges.cloudflare.com",
    // Solana/wallet SDKs spin up blob-backed web workers.
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function jsonError(message: string, status: number): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function middleware(request: NextRequest): NextResponse {
  const ip = getClientIP(request);

  // ── Rate limiting (DDoS protection) ──────────────────────────────────────
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const res = jsonError('Too Many Requests', 429);
    res.headers.set('Retry-After', String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)));
    res.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    res.headers.set('X-RateLimit-Remaining', '0');
    res.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime));
    return res;
  }

  const { pathname } = request.nextUrl;

  // ── Address validation ───────────────────────────────────────────────────
  for (const prefix of ADDR_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      const address = pathname.slice(prefix.length).split('/')[0];
      if (!isValidSolanaAddress(address)) {
        return jsonError('Invalid token address', 400);
      }
      break;
    }
  }

  // ── Timeframe validation (OHLCV only) ───────────────────────────────────
  if (pathname.startsWith('/api/ohlcv/')) {
    const type = request.nextUrl.searchParams.get('type');
    if (type !== null && !isValidTimeframe(type)) {
      return jsonError('Invalid timeframe parameter', 400);
    }
  }

  // ── Request body size limit (100 KB) ────────────────────────────────────
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 100 * 1024) {
    return jsonError('Request entity too large', 413);
  }

  // ── Apply security headers ───────────────────────────────────────────────
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime));

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico).*)',
  ],
};
