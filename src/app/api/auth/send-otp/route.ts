import { sendOtp } from "@/lib/auth";

export async function POST(request: Request) {
  let email: string | undefined;
  try {
    email = ((await request.json()) as { email?: string }).email?.trim();
  } catch {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }
  if (!email) return Response.json({ message: "Enter your email address." }, { status: 400 });
  return sendOtp(email);
}
