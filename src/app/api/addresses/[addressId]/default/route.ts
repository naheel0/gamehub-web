import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

type Ctx = { params: Promise<{ addressId: string }> };

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PUT makes this address the default (upstream demotes the rest). */
export async function PUT(_req: Request, ctx: Ctx) {
  const { addressId } = await ctx.params;
  if (!GUID.test(addressId))
    return NextResponse.json({ message: "Unknown address." }, { status: 400 });
  return relay("PUT", `/api/Addresses/${addressId}/default`);
}
