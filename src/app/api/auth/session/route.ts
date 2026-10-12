import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { AUTH_COOKIES, applyAuthCookies, refreshFromSetCookie } from "@/lib/auth";

/**
 * GET → who am I + badge counts, one client round trip.
 * No gh_access cookie → {user: null} without touching the backend.
 * Expired access (15 min) → one transparent retry through /api/Auth/refresh
 * using our relayed gh_refresh value (the backend reads it from its Cookie
 * header), rotating cookies onto this response. Network-level failure → 502
 * so the client keeps "unresolved" instead of claiming signed-out.
 */
export async function GET() {
  const store = await cookies();
  const access = store.get(AUTH_COOKIES.access)?.value;
  if (!access) return NextResponse.json({ user: null });

  let token = access;
  let rotated: string | undefined;

  let profile = await backendGet("/api/Auth/profile", token);
  if (profile?.status === 401) {
    const refresh = store.get(AUTH_COOKIES.refresh)?.value;
    const renewed = refresh ? await tryRefresh(refresh) : null;
    if (!renewed) return NextResponse.json({ user: null }); // dead session
    token = renewed.token;
    rotated = renewed.rotated;
    profile = await backendGet("/api/Auth/profile", token);
  }
  if (!profile) return NextResponse.json({ user: null }, { status: 502 });
  if (!profile.ok) return NextResponse.json({ user: null });

  const user = await readUser(profile);
  if (!user) return NextResponse.json({ user: null });

  // badge counts — plain arrays; failure degrades to "no count", never a fake 0
  const [cartCount, wishlistCount] = await Promise.all([
    countItems("/api/Cart", token),
    countItems("/api/Wishlist", token),
  ]);

  const response = NextResponse.json({ user, cartCount, wishlistCount });
  if (token !== access || rotated) applyAuthCookies(response, token, rotated);
  return response;
}

async function readUser(res: Response): Promise<{ firstName?: string; email?: string } | null> {
  try {
    const env = (await res.json()) as {
      success?: boolean;
      data?: { firstName?: string; email?: string };
    };
    if (!env.success || !env.data) return null;
    return { firstName: env.data.firstName, email: env.data.email };
  } catch {
    return null;
  }
}

async function tryRefresh(
  refresh: string,
): Promise<{ token: string; rotated?: string } | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refresh}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  try {
    const env = (await res.json()) as { success?: boolean; data?: { accessToken?: string } };
    if (!res.ok || !env.success || !env.data?.accessToken) return null;
    return { token: env.data.accessToken, rotated: refreshFromSetCookie(res.headers) };
  } catch {
    return null;
  }
}

async function countItems(path: string, token: string): Promise<number | null> {
  const res = await backendGet(path, token);
  if (!res || !res.ok) return null;
  try {
    const items = await res.json();
    return Array.isArray(items) ? items.length : null;
  } catch {
    return null;
  }
}

async function backendGet(path: string, token: string): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}
