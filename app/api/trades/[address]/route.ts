import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/validation";
import { getTopPoolAddress, getPoolTrades } from "@/lib/geckoterminal";

// Live swaps for a token via GeckoTerminal. We resolve the token's most-liquid
// pool, then fetch that pool's recent trades. Falls back to seeded mock trades
// when GeckoTerminal has no data.

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

  const pool = await getTopPoolAddress(address);
  if (pool) {
    const poolTrades = await getPoolTrades(pool);
    if (poolTrades.length) {
      const trades = poolTrades.map((t) => ({
        txHash: t.txHash,
        type: t.kind,
        price: t.priceUsd,
        amount: t.tokenAmount,
        value: t.valueUsd,
        wallet: shortWallet(t.maker),
        timestamp: t.timestamp,
      }));
      return NextResponse.json({ trades });
    }
  }

  return NextResponse.json({ trades: generateMockTrades(address) });
}
