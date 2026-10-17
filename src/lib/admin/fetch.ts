import { cookies } from "next/headers";
import { API_BASE } from "@/lib/backend-url";
import { AUTH_COOKIES } from "@/lib/auth-constants";
import type { ApiEnvelope, PagedGames } from "@/lib/types";
import type { AdminOrderListDto, AdminUserListDto } from "@/lib/admin/types";

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

/**
 * Paged admin orders — raw array body, total in X-Total-Count. The admin
 * binder speaks json-server aliases (q/_sort/_order/_page/_limit); the
 * status filter binds under its plain name via [FromQuery]. _order is always
 * sent: AdminQueryParameters defaults SortOrder to ASC, while the orders
 * surface defaults to newest-first (the backend switch only honors order
 * when a sort key is present).
 */
export async function adminOrdersPage(q: {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: string;
  status?: string;
}): Promise<AdminResult<{ items: AdminOrderListDto[]; totalCount: number }>> {
  const params = new URLSearchParams();
  params.set("_page", String(q.page));
  params.set("_limit", String(q.limit));
  params.set("_sort", q.sort);
  params.set("_order", q.order);
  if (q.search) params.set("q", q.search);
  if (q.status) params.set("status", q.status);

  const got = await adminFetch(`/api/admin/AdminOrders?${params}`);
  if (got.kind !== "ok") return got;
  const totalCount = Number(got.res.headers.get("X-Total-Count"));
  try {
    const items = (await got.res.json()) as AdminOrderListDto[];
    if (!Array.isArray(items) || !Number.isFinite(totalCount)) return { kind: "unreachable" };
    return { kind: "ok", data: { items, totalCount } };
  } catch {
    return { kind: "unreachable" };
  }
}

/**
 * Paged admin users — same raw-array + X-Total-Count shape; route token is
 * api/admin/AdminUsers ([controller]), ids are ints. status/role bind under
 * their plain names via [FromQuery]; _order is always sent for the same
 * reason as orders (params default SortOrder to ASC, the surface defaults
 * to newest-first).
 */
export async function adminUsersPage(q: {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: string;
  status?: string;
  role?: string;
}): Promise<AdminResult<{ items: AdminUserListDto[]; totalCount: number }>> {
  const params = new URLSearchParams();
  params.set("_page", String(q.page));
  params.set("_limit", String(q.limit));
  params.set("_sort", q.sort);
  params.set("_order", q.order);
  if (q.search) params.set("q", q.search);
  if (q.status) params.set("status", q.status);
  if (q.role) params.set("role", q.role);

  const got = await adminFetch(`/api/admin/AdminUsers?${params}`);
  if (got.kind !== "ok") return got;
  const totalCount = Number(got.res.headers.get("X-Total-Count"));
  try {
    const items = (await got.res.json()) as AdminUserListDto[];
    if (!Array.isArray(items) || !Number.isFinite(totalCount)) return { kind: "unreachable" };
    return { kind: "ok", data: { items, totalCount } };
  } catch {
    return { kind: "unreachable" };
  }
}
