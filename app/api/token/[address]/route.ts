import { NextResponse } from "next/server";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

async function fetchBirdEye(path: string) {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey || apiKey === "your-birdeye-api-key-here") return null;

  try {
    const res = await fetch(`${BIRDEYE_BASE}${path}`, {
      headers: { "X-API-KEY": apiKey, "x-chain": "solana" },
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const data = await fetchBirdEye(
    `/defi/v3/token/overview?address=${address}`
  );

  if (data?.data) {
    return NextResponse.json({ token: data.data });
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
