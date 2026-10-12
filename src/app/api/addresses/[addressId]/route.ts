import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ addressId: string }> };

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const badId = () => NextResponse.json({ message: "Unknown address." }, { status: 400 });

/** PUT edits one address / DELETE removes it (idempotent upstream). */
export async function PUT(req: Request, ctx: Ctx) {
  const { addressId } = await ctx.params;
  if (!GUID.test(addressId)) return badId();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  return relay("PUT", `/api/Addresses/${addressId}`, body);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { addressId } = await ctx.params;
  if (!GUID.test(addressId)) return badId();
  return relay("DELETE", `/api/Addresses/${addressId}`);
}
