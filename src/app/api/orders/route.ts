import { NextRequest, NextResponse } from "next/server";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json({
    ok: true,
    orderNumber: generateOrderNumber(),
    receivedItems: body.items?.length ?? 0,
    paymentMode: "mock",
  });
}
