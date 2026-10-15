import { NextResponse, type NextRequest } from "next/server";
import { API_BASE } from "@/lib/backend-url";
import { ACCESS_MAX_AGE, AUTH_COOKIES, COOKIE_BASE, REFRESH_MAX_AGE } from "@/lib/auth-constants";

/**
 * /admin gate — runs before every admin navigation, which is the one place
 * that can both check the role and set rotated cookies server-side (a
 * server component cannot write cookies). This gate is UX and defense in
 * depth: the real boundary is [Authorize(Roles="Admin")] on every admin
 * controller, which holds even if this file never ran.
 *
 * Same contract as lib/auth.ts: 401 = genuinely signed out (→ login),
 * network/5xx = the backend is unreachable → let the page render its honest
 * error state, never a false sign-out.
 */

async function profile(token: string): Promise<
  { kind: "ok"; role: string | null } | { kind: "denied" } | { kind: "unreachable" }
> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return { kind: "unreachable" };
  }
  if (res.status >= 500) return { kind: "unreachable" };
  if (!res.ok) return { kind: "denied" };
  try {
    const env = (await res.json()) as { data?: { role?: string } };
    return { kind: "ok", role: env.data?.role ?? null };
  } catch {
    return { kind: "unreachable" };
  }
}

/** refresh tokens are single-use server-side: success rotates gh_refresh. */
async function refresh(
  refreshToken: string,
): Promise<{ access: string; rotated?: string } | null | "unreachable"> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return "unreachable";
  }
  if (res.status >= 500) return "unreachable";
  try {
    const env = (await res.json()) as { success?: boolean; data?: { accessToken?: string } };
    if (!res.ok || !env.success || !env.data?.accessToken) return null;
    const rotated = res.headers
      .getSetCookie()
      .find((c) => c.startsWith("refreshToken="))
      ?.split(";")[0]
      ?.slice("refreshToken=".length);
    return { access: env.data.accessToken, rotated };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);

  const currentAccess = req.cookies.get(AUTH_COOKIES.access)?.value;
  const refreshCookie = req.cookies.get(AUTH_COOKIES.refresh)?.value;

  let access = currentAccess;
  let rotatedRefresh: string | undefined;

  // missing gh_access is what a normal 15-minute expiry looks like; a
  // surviving gh_refresh means the session may still be alive — rotate
  // instead of forcing a sign-in (same reasoning as relay()).
  if (!access) {
    if (!refreshCookie) return NextResponse.redirect(login);
    const renewed = await refresh(refreshCookie);
    if (renewed === "unreachable") return NextResponse.next();
    if (!renewed) return NextResponse.redirect(login);
    access = renewed.access;
    rotatedRefresh = renewed.rotated;
  }

  let id = await profile(access);
  if (id.kind === "denied" && refreshCookie) {
    // token revoked mid-session — one refresh retry, then it's a real sign-out
    const renewed = await refresh(refreshCookie);
    if (renewed === "unreachable") id = { kind: "unreachable" };
    else if (!renewed) id = { kind: "denied" };
    else {
      access = renewed.access;
      rotatedRefresh = renewed.rotated;
      id = await profile(access);
    }
  }

  if (id.kind === "unreachable") return NextResponse.next(); // page tells the truth
  if (id.kind !== "ok") return NextResponse.redirect(login);
  if (id.role !== "Admin") return NextResponse.redirect(new URL("/", req.url)); // customer: /admin stays unadvertised

  const res = NextResponse.next();
  if (access !== currentAccess) {
    res.cookies.set(AUTH_COOKIES.access, access, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE });
  }
  if (rotatedRefresh) {
    res.cookies.set(AUTH_COOKIES.refresh, rotatedRefresh, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE });
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
