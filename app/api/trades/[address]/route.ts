import { NextResponse } from "next/server";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

function generateMockTrades(address: string, count = 30) {
  const wallets = [
    "7xKp...3Rft", "9aLm...Wq2x", "BcZn...8Yh1", "Dw4R...5Tpj",
    "Fg8S...Lk7n", "HjT2...9Qwe", "Km6V...Xt4b", "Np3Y...2Cvs",
  ];
  const now = Date.now();
  const trades = [];
  let price = (parseInt(address.slice(0, 6), 16) % 10000) / 100 + 0.1;

  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.45;
    const priceChange = (Math.random() - 0.48) * price * 0.005;
    price = Math.max(0.000001, price + priceChange);
    const amount = Math.random() * 50000 + 100;
    const value = amount * price;

    trades.push({
      txHash: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
      type: isBuy ? "buy" : "sell",
      price,
      amount,
      value,
      wallet: wallets[Math.floor(Math.random() * wallets.length)],
      timestamp: now - i * (Math.random() * 60000 + 5000),
    });
  }

  return trades;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (apiKey && apiKey !== "your-birdeye-api-key-here") {
    try {
      const res = await fetch(
        `${BIRDEYE_BASE}/defi/txs/token?address=${address}&tx_type=swap&offset=0&limit=50`,
        {
          headers: { "X-API-KEY": apiKey, "x-chain": "solana" },
          next: { revalidate: 5 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.items?.length) {
          const trades = data.data.items.map((t: Record<string, unknown>) => ({
            txHash: t.txHash,
            type: (t.side as string) === "buy" ? "buy" : "sell",
            price: t.price,
            amount: t.tokenAmount,
            value: t.volumeUSD,
            wallet: `${(t.owner as string)?.slice(0, 4)}...${(t.owner as string)?.slice(-4)}`,
            timestamp: (t.blockUnixTime as number) * 1000,
          }));
          return NextResponse.json({ trades });
        }
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ trades: generateMockTrades(address) });
}
