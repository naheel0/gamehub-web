import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

/** Signed-in address book (GET list / POST create). */
export async function GET() {
  return relay("GET", "/api/Addresses");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  return relay("POST", "/api/Addresses", body);
}
