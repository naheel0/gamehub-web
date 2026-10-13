import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ orderId: string }> };

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET one order by its GUID — the confirmation page's success detail. */
export async function GET(_req: Request, ctx: Ctx) {
  const { orderId } = await ctx.params;
  if (!GUID.test(orderId))
    return NextResponse.json({ message: "Unknown order." }, { status: 400 });
  return relay("GET", `/api/Orders/${orderId}`);
}
