import { NextResponse } from "next/server";
import { PLANS, confirmPayment, getPayment } from "@/bot/payments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "plans") {
    return NextResponse.json({ plans: PLANS });
  }

  if (action === "status") {
    const paymentId = searchParams.get("paymentId");
    if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });
    const payment = getPayment(paymentId);
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    return NextResponse.json({ payment });
  }

  return NextResponse.json({ plans: PLANS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, paymentId } = body;

    if (action === "confirm" && paymentId) {
      const ok = confirmPayment(paymentId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
