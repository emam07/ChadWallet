import { NextResponse } from "next/server";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

function generateMockOHLCV(basePrice: number, count = 200) {
  const now = Math.floor(Date.now() / 1000);
  const interval = 15 * 60; // 15 minutes
  const candles = [];
  let price = basePrice;

  for (let i = count; i >= 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = basePrice * 1000000 * (0.5 + Math.random());
    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "15m";

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (apiKey && apiKey !== "your-birdeye-api-key-here") {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 60 * 60 * 24 * 7; // 7 days

    try {
      const res = await fetch(
        `${BIRDEYE_BASE}/defi/ohlcv?address=${address}&type=${type}&time_from=${from}&time_to=${now}`,
        {
          headers: { "X-API-KEY": apiKey, "x-chain": "solana" },
          next: { revalidate: 60 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.items?.length) {
          const candles = data.data.items.map(
            (item: Record<string, number>) => ({
              time: item.unixTime,
              open: item.o,
              high: item.h,
              low: item.l,
              close: item.c,
              volume: item.v,
            })
          );
          return NextResponse.json({ candles });
        }
      }
    } catch {
      // fall through to mock
    }
  }

  // Mock data: use address hash to seed a base price
  const seedPrice =
    (parseInt(address.slice(0, 8), 16) % 10000) / 100 + 0.01;
  return NextResponse.json({ candles: generateMockOHLCV(seedPrice) });
}
