import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/validation";
import { getTokenTrades } from "@/lib/birdeye";

// Live swaps for a token via BirdEye. Falls back to seeded mock trades when
// BirdEye has no data (or no API key is configured).

function shortWallet(maker: string | null): string {
  if (!maker || maker.length < 8) return maker || "unknown";
  return `${maker.slice(0, 4)}...${maker.slice(-4)}`;
}

function generateMockTrades(address: string, count = 30) {
  const wallets = [
    "7xKp...3Rft", "9aLm...Wq2x", "BcZn...8Yh1", "Dw4R...5Tpj",
    "Fg8S...Lk7n", "HjT2...9Qwe", "Km6V...Xt4b", "Np3Y...2Cvs",
  ];
  const now = Date.now();
  const trades = [];
  // Sum char codes for a safe, always-valid seed price
  const seed = address.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 10_000;
  let price = seed / 100 + 0.1;

  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.45;
    const priceChange = (Math.random() - 0.48) * price * 0.005;
    price = Math.max(0.000001, price + priceChange);
    const amount = Math.random() * 50_000 + 100;
    const value = amount * price;

    trades.push({
      txHash: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
      type: isBuy ? "buy" : "sell",
      price,
      amount,
      value,
      wallet: wallets[Math.floor(Math.random() * wallets.length)],
      timestamp: now - i * (Math.random() * 60_000 + 5_000),
    });
  }

  return trades;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  const tokenTrades = await getTokenTrades(address);
  if (tokenTrades.length) {
    const trades = tokenTrades.map((t) => ({
      txHash: t.txHash,
      type: t.type,
      price: t.price,
      amount: t.amount,
      value: t.value,
      wallet: shortWallet(t.maker),
      timestamp: t.timestamp,
    }));
    return NextResponse.json({ trades });
  }

  return NextResponse.json({ trades: generateMockTrades(address) });
}
