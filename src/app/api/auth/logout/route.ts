import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { AUTH_COOKIES, tryRefresh } from "@/lib/auth";

/**
 * POST → sign out. One backend call does everything (verified in source):
 * AuthService.Logout revokes ALL the user's refresh tokens and blacklists
 * the access token's jti. Our own cookies are cleared regardless — if the
 * backend is unreachable the user is still signed out of this browser.
 */
export async function POST() {
  const store = await cookies();
  let access = store.get(AUTH_COOKIES.access)?.value;

  if (!access) {
    // gh_access dies at 15 min — rotate once so the backend logout can still
    // revoke the server-side session; a dead refresh means nothing to revoke
    const refresh = store.get(AUTH_COOKIES.refresh)?.value;
    if (refresh) {
      const renewed = await tryRefresh(refresh);
      if (renewed.kind === "ok") access = renewed.token;
    }
  }

  if (access) {
    try {
      await fetch(`${API_BASE}/api/Auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    } catch {
      /* backend unreachable — local sign-out still proceeds */
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIES.access);
  response.cookies.delete(AUTH_COOKIES.refresh);
  return response;
}
