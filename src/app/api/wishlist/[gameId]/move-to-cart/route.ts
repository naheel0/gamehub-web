import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ gameId: string }> };

/** Wishlist → cart in one backend call (stock-checked there). */
export async function POST(_req: Request, ctx: Ctx) {
  const { gameId } = await ctx.params;
  if (!/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: "Unknown item." }, { status: 400 });
  }
  return relay("POST", `/api/Wishlist/${gameId}/move-to-cart`);
}
