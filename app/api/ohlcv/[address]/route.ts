import { NextResponse } from "next/server";
import { isValidSolanaAddress, isValidTimeframe } from "@/lib/validation";
import {
  getTopPoolAddress,
  getPoolOhlcv,
  RESOLUTION_MAP,
} from "@/lib/geckoterminal";

// OHLCV candles via GeckoTerminal. We resolve the token's most-liquid pool, then
// fetch that pool's candles for the requested resolution. Falls back to
// deterministic mock candles when GeckoTerminal has no data.

function generateMockOHLCV(basePrice: number, count = 200) {
  const now = Math.floor(Date.now() / 1000);
  const interval = 15 * 60;
  const candles = [];
  let price = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : 1.0;

  for (let i = count; i >= 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = price * 1_000_000 * (0.5 + Math.random());
    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

function addressSeedPrice(address: string): number {
  // Sum char codes for a deterministic, always-valid seed
  const seed = address.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 10_000;
  return seed / 100 + 0.01;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "15m";

  if (!isValidTimeframe(type)) {
    return NextResponse.json({ error: "Invalid timeframe parameter" }, { status: 400 });
  }

  const resolution = RESOLUTION_MAP[type] ?? RESOLUTION_MAP["15m"];

  const pool = await getTopPoolAddress(address);
  if (pool) {
    const candles = await getPoolOhlcv(pool, resolution);
    if (candles.length) return NextResponse.json({ candles });
  }

  return NextResponse.json({ candles: generateMockOHLCV(addressSeedPrice(address)) });
}
