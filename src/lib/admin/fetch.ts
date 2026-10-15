import { cookies } from "next/headers";
import { API_BASE } from "@/lib/backend-url";
import { AUTH_COOKIES } from "@/lib/auth-constants";
import type { ApiEnvelope, PagedGames } from "@/lib/types";

type NonOk =
  /** token missing/revoked — the proxy's refresh already ran this navigation */
  | { kind: "denied" }
  /** GET says "no such thing" — caller renders notFound(), never a sign-out */
  | { kind: "missing" }
  /** backend down or replied junk — caller throws the honest error */
  | { kind: "unreachable" };

export type AdminResult<T> = { kind: "ok"; data: T } | NonOk;

/** Shared sessioned transport: no-store (an admin view never renders from a
 *  cache), 15s ceiling, and the status split every admin read agrees on:
 *  5xx/network → unreachable, 400/404 → missing, 401/403 → denied. */
async function adminFetch(path: string): Promise<{ kind: "ok"; res: Response } | NonOk> {
  const store = await cookies();
  const access = store.get(AUTH_COOKIES.access)?.value;
  if (!access) return { kind: "denied" };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { kind: "unreachable" };
  }
  if (res.status >= 500) return { kind: "unreachable" };
  if (res.status === 404 || res.status === 400) return { kind: "missing" };
  if (!res.ok) return { kind: "denied" };
  return { kind: "ok", res };
}

/** Admin GET where the body IS the payload — admin controllers answer with
 *  the raw DTO (Ok(stats), Ok(user), Ok(game)), no ApiResponse envelope;
 *  paged lists carry their total in X-Total-Count, not the body. */
export async function adminGet<T>(path: string): Promise<AdminResult<T>> {
  const got = await adminFetch(path);
  if (got.kind !== "ok") return got;
  try {
    const data = (await got.res.json()) as T;
    if (data === null || data === undefined) return { kind: "unreachable" };
    return { kind: "ok", data };
  } catch {
    return { kind: "unreachable" };
  }
}

/**
 * The admin table reuses the PUBLIC catalog endpoint — there is no admin
 * games LIST. Same verified params as lib/api.ts's fetchGamesPage
 * (page/pageSize/search/sortBy/sortOrder), but sessioned and uncached.
 * The public list answers with the ApiResponse envelope, unlike admin GETs.
 */
export async function adminGamesPage(q: {
  page: number;
  pageSize: number;
  search?: string;
  sortBy: string;
  sortOrder: string;
}): Promise<AdminResult<PagedGames>> {
  const params = new URLSearchParams();
  params.set("page", String(q.page));
  params.set("pageSize", String(q.pageSize));
  if (q.search) params.set("search", q.search);
  params.set("sortBy", q.sortBy);
  params.set("sortOrder", q.sortOrder);

  const got = await adminFetch(`/api/Games?${params}`);
  if (got.kind !== "ok") return got;
  try {
    const json = (await got.res.json()) as ApiEnvelope<PagedGames>;
    const { items, totalCount, totalPages } = json?.data ?? ({} as PagedGames);
    if (json?.success !== true || !Array.isArray(items) || typeof totalCount !== "number") {
      return { kind: "unreachable" };
    }
    return { kind: "ok", data: { items, totalCount, totalPages } };
  } catch {
    return { kind: "unreachable" };
  }
}
