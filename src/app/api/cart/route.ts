import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

/** GET list / POST {gameId, quantity} — qty rules enforced upstream. */
export async function GET() {
  return relay("GET", "/api/Cart");
}

/** DELETE clears every line in the cart. */
export async function DELETE() {
  return relay("DELETE", "/api/Cart");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  return relay("POST", "/api/Cart", body);
}
