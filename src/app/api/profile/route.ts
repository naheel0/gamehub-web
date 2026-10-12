import { NextResponse } from "next/server";
import { relay } from "@/lib/auth";

/** Signed-in profile, resolved server-side (browser never hits the API). */
export async function GET() {
  return relay("GET", "/api/Auth/profile");
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Check your request and try again." }, { status: 400 });
  return relay("PUT", "/api/Auth/profile", body);
}
