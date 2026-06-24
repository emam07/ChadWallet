import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/validation";
import { getTokenPair } from "@/lib/dexscreener";
import { num } from "@/lib/num";

// Single-token overview via DexScreener (most-liquid Solana pair). Falls back to
// a neutral "unknown token" shape when DexScreener has no data for the address.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }

  const pair = await getTokenPair(address);

  if (pair?.baseToken) {
    return NextResponse.json({
      token: {
        address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        price: num(pair.priceUsd),
        // DexScreener priceChange.h24 is already a percent.
        priceChange24hPercent: num(pair.priceChange?.h24),
        v24hUSD: num(pair.volume?.h24),
        mc: num(pair.marketCap ?? pair.fdv),
        // DexScreener does not expose holder counts.
        holder: 0,
        logoURI: pair.info?.imageUrl ?? undefined,
      },
    });
  }

  return NextResponse.json({
    token: {
      address,
      symbol: "UNKNOWN",
      name: "Unknown Token",
      price: 0,
      priceChange24hPercent: 0,
      v24hUSD: 0,
      mc: 0,
      holder: 0,
    },
  });
}
