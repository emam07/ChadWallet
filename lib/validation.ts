// Solana base58 alphabet: 1-9, A-H, J-N, P-Z, a-k, m-z (no 0, O, I, l)
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const VALID_TIMEFRAMES = new Set([
  '1m', '3m', '5m', '15m', '30m',
  '1H', '2H', '4H', '6H', '8H', '12H',
  '1D', '3D', '1W', '1M',
]);

export const VALID_TIMEFRAMES_LIST = Array.from(VALID_TIMEFRAMES);

export function isValidSolanaAddress(addr: unknown): addr is string {
  if (typeof addr !== 'string') return false;
  // Reject null bytes before regex (avoids bypass tricks)
  if (addr.includes('\0')) return false;
  // Strict length: Solana addresses are 32–44 base58 chars
  if (addr.length < 32 || addr.length > 44) return false;
  // Base58 alphabet only — rejects XSS, SQL, shell, path traversal, unicode
  return SOLANA_ADDRESS_RE.test(addr);
}

export function isValidTimeframe(t: unknown): t is string {
  if (typeof t !== 'string') return false;
  // Exact match against allowlist (no regex, immune to ReDoS)
  return VALID_TIMEFRAMES.has(t);
}
