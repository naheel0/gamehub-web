import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ purchaseId: string }> };

/** POST: mint the Razorpay payment link for a placed order →
 * { razorpayPaymentLinkId, shortUrl, purchaseId, orderId, amount, currency }. */
export async function POST(_req: Request, ctx: Ctx) {
  const { purchaseId } = await ctx.params;
  if (!/^\d+$/.test(purchaseId))
    return NextResponse.json({ message: "Unknown order." }, { status: 400 });
  return relay("POST", `/api/Payments/create-link/${purchaseId}`);
}
