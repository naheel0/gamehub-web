import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bad = (message: string) => NextResponse.json({ message }, { status: 400 });

/** GET: order history (rows carry full detail). POST: place the order —
 * returns the OrderDto the payment step hands to create-link. */
export async function GET() {
  return relay("GET", "/api/Orders");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Check your request and try again.");
  const { addressId, paymentMethod } = body as { addressId?: unknown; paymentMethod?: unknown };
  if (typeof addressId !== "string" || !GUID.test(addressId))
    return bad("Choose a delivery address first.");
  if (paymentMethod !== "Razorpay") return bad("That payment method isn't available.");
  return relay("POST", "/api/Orders", { addressId, paymentMethod: "Razorpay" });
}
