import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

/** POST: register Razorpay's paid callback against the purchase →
 * { success, message?, orderId }. Amount is omitted on purpose — the
 * backend derives it from the purchase (paise) and skips the check when
 * absent, so the caller never has to round money. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  const { purchaseId, razorpayPaymentLinkId, razorpayPaymentId } = body as {
    purchaseId?: unknown;
    razorpayPaymentLinkId?: unknown;
    razorpayPaymentId?: unknown;
  };
  if (typeof purchaseId !== "number" || !Number.isInteger(purchaseId) || purchaseId < 1)
    return NextResponse.json({ message: "Missing the order reference." }, { status: 400 });
  if (typeof razorpayPaymentLinkId !== "string" || !razorpayPaymentLinkId)
    return NextResponse.json({ message: "Missing the payment link reference." }, { status: 400 });
  if (typeof razorpayPaymentId !== "string" || !razorpayPaymentId)
    return NextResponse.json({ message: "Missing the payment reference." }, { status: 400 });
  return relay("POST", "/api/Payments/confirm-link", {
    purchaseId,
    razorpayPaymentLinkId,
    razorpayPaymentId,
  });
}
