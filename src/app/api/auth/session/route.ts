import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIES, applyAuthCookies, backendFetch, tryRefresh } from "@/lib/auth";

/**
 * GET → who am I + badge counts, one client round trip.
 * No auth cookies at all → {user: null} without touching the backend.
 * gh_access died (15-min max-age matches the JWT, so the browser deletes it)
 * while gh_refresh survives → rotate through /api/Auth/refresh first — the
 * backend reads the relayed value from its Cookie header — and land the
 * rotated cookies on this response. Expired-but-present access → the same
 * transparent retry on 401. Network-level failure → 502 so the client keeps
 * "unresolved" instead of claiming signed-out.
 */
export async function GET() {
  const store = await cookies();
  const originalAccess = store.get(AUTH_COOKIES.access)?.value;
  let access = originalAccess;
  let rotated: string | undefined;

  if (!access) {
    const refresh = store.get(AUTH_COOKIES.refresh)?.value;
    if (!refresh) return NextResponse.json({ user: null });
    const renewed = await tryRefresh(refresh);
    if (renewed.kind === "network") return NextResponse.json({ user: null }, { status: 502 });
    if (renewed.kind !== "ok") return NextResponse.json({ user: null });
    access = renewed.token;
    rotated = renewed.rotated;
  }

  let token = access;
  let profile = await backendFetch("/api/Auth/profile", token);
  if (profile?.status === 401) {
    const refresh = store.get(AUTH_COOKIES.refresh)?.value;
    const renewed = refresh ? await tryRefresh(refresh) : { kind: "dead" as const };
    if (renewed.kind === "network") return NextResponse.json({ user: null }, { status: 502 });
    if (renewed.kind !== "ok") return NextResponse.json({ user: null }); // dead session
    token = renewed.token;
    rotated = renewed.rotated;
    profile = await backendFetch("/api/Auth/profile", token);
  }
  if (!profile) return NextResponse.json({ user: null }, { status: 502 });
  if (!profile.ok) return NextResponse.json({ user: null });

  const user = await readUser(profile);
  // a 200 we can't parse into the envelope shape is a backend lie — 502 keeps
  // the client "unresolved" instead of claiming signed-out
  if (!user) return NextResponse.json({ user: null }, { status: 502 });

  // badge counts — plain arrays; failure degrades to "no count", never a fake 0
  const [cartCount, wishlistCount] = await Promise.all([
    countItems("/api/Cart", token),
    countItems("/api/Wishlist", token),
  ]);

  const response = NextResponse.json({ user, cartCount, wishlistCount });
  if (token !== originalAccess || rotated) applyAuthCookies(response, token, rotated);
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

async function countItems(path: string, token: string): Promise<number | null> {
  const res = await backendFetch(path, token);
  if (!res || !res.ok) return null;
  try {
    const items = await res.json();
    return Array.isArray(items) ? items.length : null;
  } catch {
    return null;
  }
}
