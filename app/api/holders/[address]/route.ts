import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/validation";
import { getTokenHolders } from "@/lib/birdeye";

// Top holders for a token via BirdEye's holder-distribution endpoint. Unlike the
// trades route, there is no mock fallback — holder data is either real or the
// route reports honestly why it's missing (plan-gated / rate-limited / network),
// each with a proper HTTP status the client differentiates.

const PLAN_MESSAGE =
  "Holder analytics aren't available for the current API plan.";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "invalid_token", message: "Invalid token address." },
      { status: 400 }
    );
  }

  const result = await getTokenHolders(address);

  switch (result.status) {
    case "ok":
      // Empty array = genuinely zero holders; the client renders an empty state.
      return NextResponse.json({ holders: result.holders });

    case "unauthorized":
      return NextResponse.json(
        { error: "plan_unavailable", message: PLAN_MESSAGE },
        { status: 403 }
      );

    case "rate_limited":
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Holder data is rate limited right now — try again shortly.",
        },
        { status: 429 }
      );

    case "network_error":
      return NextResponse.json(
        {
          error: "network_error",
          message: "Couldn't reach the holder data service. Please retry.",
        },
        { status: 502 }
      );

    case "unavailable":
    default:
      return NextResponse.json(
        { error: "unavailable", message: PLAN_MESSAGE },
        { status: 503 }
      );
  }
}
