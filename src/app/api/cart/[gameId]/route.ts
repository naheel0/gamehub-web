import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ gameId: string }> };

const badId = () => NextResponse.json({ message: "Unknown item." }, { status: 400 });

/** PUT {quantity} (1–99, upstream-validated) / DELETE one line. */
export async function PUT(req: Request, ctx: Ctx) {
  const { gameId } = await ctx.params;
  if (!/^\d+$/.test(gameId)) return badId();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  return relay("PUT", `/api/Cart/${gameId}`, body);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { gameId } = await ctx.params;
  if (!/^\d+$/.test(gameId)) return badId();
  return relay("DELETE", `/api/Cart/${gameId}`);
}
