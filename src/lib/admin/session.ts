import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE } from "@/lib/backend-url";
import { AUTH_COOKIES } from "@/lib/auth-constants";

/** The one role the backend's [Authorize(Roles="Admin")] accepts — verbatim
 *  from the DTO/JWT. Never compare lowercased: the API is case-sensitive. */
export const ADMIN_ROLE = "Admin";

export type AdminSession = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
};

export type AdminGate =
  | { kind: "admin"; user: AdminSession }
  /** genuinely signed out, session dead, or a customer — never an error */
  | { kind: "denied" }
  /** backend unreachable — the page must tell the truth, not sign anyone out */
  | { kind: "unreachable" };

/**
 * Server-side identity check for the /admin tree (defense in depth behind
 * src/proxy.ts, which is the gate that also rotates tokens). Pure read:
 * no refresh, no cookie writes — a server component cannot set cookies, and
 * rotating here would burn the single-use refresh token without persisting
 * the new one. Views must never render from a cached identity, hence
 * no-store; the proxy keeps gh_access fresh on every navigation.
 * cache()-deduped: layout and page share one fetch per request.
 */
export const requireAdmin = cache(async function requireAdmin(): Promise<AdminGate> {
  const store = await cookies();
  const access = store.get(AUTH_COOKIES.access)?.value;
  if (!access) return { kind: "denied" };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/profile`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { kind: "unreachable" };
  }
  if (res.status >= 500) return { kind: "unreachable" };
  if (!res.ok) return { kind: "denied" };

  let env: { data?: Partial<AdminSession> } | null = null;
  try {
    env = (await res.json()) as { data?: Partial<AdminSession> };
  } catch {
    return { kind: "unreachable" };
  }
  const user = env?.data;
  if (!user || typeof user.id !== "number") return { kind: "unreachable" };
  if (user.role !== ADMIN_ROLE) return { kind: "denied" };
  return { kind: "admin", user: user as AdminSession };
});
