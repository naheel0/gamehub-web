import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ gameId: string }> };

/** Upstream route is {int gameId} — never forward junk path segments. */
const badId = () => NextResponse.json({ message: "Unknown item." }, { status: 400 });

export async function POST(_req: Request, ctx: Ctx) {
  const { gameId } = await ctx.params;
  if (!/^\d+$/.test(gameId)) return badId();
  return relay("POST", `/api/Wishlist/${gameId}`);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { gameId } = await ctx.params;
  if (!/^\d+$/.test(gameId)) return badId();
  return relay("DELETE", `/api/Wishlist/${gameId}`);
}
