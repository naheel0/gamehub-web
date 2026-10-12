import { NextResponse } from "next/server";
import { API_BASE } from "./api";

/**
 * Server-side proxy for the auth API (same CORS reason every other fetch
 * lives server-side). The JWT pair never reaches client JS: on success the
 * access token moves into our own httpOnly cookie, and the refresh token —
 * which the controller only ships via Set-Cookie, nulling it in the body —
 * is relayed from the backend's response header.
 *
 * Verified against backend source (GameHubApi):
 * - POST /api/Auth/login {email, password}
 * - POST /api/Auth/send-otp {email} → 6-digit code, emailed, 10 min expiry
 * - POST /api/Auth/verify-and-register {email, otp, password, confirmPassword,
 *   firstName, lastName, phone} (the docs' plain /register no longer exists)
 * - envelope {success, message, data}; access 15 min, refresh 7 days
 */

export const AUTH_COOKIES = { access: "gh_access", refresh: "gh_refresh" } as const;

// matches backend JwtSettings: AccessTokenExpirationMinutes 15 / RefreshTokenExpirationDays 7
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 3600;

type AuthEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    status?: string;
    accessToken?: string;
  };
};

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Set the JWT pair on our response — single source of cookie truth. */
export function applyAuthCookies(
  response: NextResponse,
  token: string,
  rotatedRefresh?: string,
): NextResponse {
  response.cookies.set(AUTH_COOKIES.access, token, { ...cookieBase, maxAge: ACCESS_MAX_AGE });
  if (rotatedRefresh) {
    response.cookies.set(AUTH_COOKIES.refresh, rotatedRefresh, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE,
    });
  }
  return response;
}

/** The backend ships refreshToken via Set-Cookie (body field nulled). */
export function refreshFromSetCookie(headers: Headers): string | undefined {
  const pair = headers
    .getSetCookie()
    .find((c) => c.startsWith("refreshToken="))
    ?.split(";")[0];
  return pair?.slice("refreshToken=".length);
}

/** One shared handler for the two token-issuing endpoints. */
export async function authFlow(
  endpoint: "login" | "verify-and-register",
  body: unknown,
): Promise<NextResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "We couldn't reach the store right now. Refresh in a moment." },
      { status: 502 },
    );
  }

  let env: AuthEnvelope | null = null;
  try {
    env = (await res.json()) as AuthEnvelope;
  } catch {
    /* non-JSON error body — handled below */
  }

  const token = env?.data?.accessToken;
  if (!res.ok || !env?.success || !token) {
    // ponytail: backend's OTP-fail path reuses the refresh-token message
    // (copy-paste bug in AuthController.VerifyAndRegister) — translate the
    // one leaked string; delete when the backend message is fixed
    const raw = env?.message ?? "";
    const message =
      endpoint === "verify-and-register" && raw.includes("refresh token")
        ? "That code didn't match or has expired. Request a new code and try again."
        : raw || "Something went wrong. Try again.";
    return NextResponse.json({ message }, { status: res.ok ? 400 : res.status });
  }

  const { id, email, firstName, lastName, phone, role, status } = env.data!;
  const response = NextResponse.json(
    { user: { id, email, firstName, lastName, phone, role, status } },
    { status: 200 },
  );
  return applyAuthCookies(response, token, refreshFromSetCookie(res.headers));
}

/** send-otp: no tokens, just the backend's message forwarded honestly. */
export async function sendOtp(email: string): Promise<NextResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "We couldn't reach the store right now. Refresh in a moment." },
      { status: 502 },
    );
  }
  let env: { message?: string } | null = null;
  try {
    env = await res.json();
  } catch {
    /* handled below */
  }
  return NextResponse.json(
    { message: env?.message || (res.ok ? "OTP sent to your email address." : "Try again.") },
    { status: res.ok ? 200 : res.status || 400 },
  );
}
