import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST: single-title order straight from a game page — same OrderDto shape. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  const { gameId, quantity, addressId } = body as {
    gameId?: unknown;
    quantity?: unknown;
    addressId?: unknown;
  };
  if (typeof gameId !== "number" || !Number.isInteger(gameId) || gameId < 1)
    return NextResponse.json({ message: "That title couldn't be ordered." }, { status: 400 });
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
    return NextResponse.json({ message: "Quantity must be between 1 and 99." }, { status: 400 });
  if (typeof addressId !== "string" || !GUID.test(addressId))
    return NextResponse.json({ message: "Choose a delivery address first." }, { status: 400 });
  return relay("POST", "/api/Orders/buy-now", { gameId, quantity, addressId });
}
