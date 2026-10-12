import { cacheLife } from "next/cache";
import type { ApiEnvelope, Game, PagedGames } from "./types";

// ponytail: env override for local dev, deployed URL as default.
export const API_BASE =
  process.env.BACKEND_API_URL ??
  "https://gamehub1-hsdtbxdcfvfva3fw.centralindia-01.azurewebsites.net";

const REQUIRED_FIELDS = [
  "id",
  "name",
  "genre",
  "platform",
  "price",
  "rating",
  "inStock",
  "imageUrls",
] as const;

/** Fails loudly if the API contract drifts — never renders half a catalog. */
export function assertPagedGames(json: ApiEnvelope<PagedGames>): PagedGames {
  if (!json || json.success !== true) {
    throw new Error(`Games API envelope: ${json?.message ?? "no payload"}`);
  }
  const { items, totalCount, totalPages } = json.data ?? ({} as PagedGames);
  if (!Array.isArray(items) || typeof totalCount !== "number") {
    throw new Error("Games API shape: data.items/data.totalCount missing");
  }
  for (const g of items) {
    for (const f of REQUIRED_FIELDS) {
      if (g[f] === undefined || g[f] === null) {
        throw new Error(`Games API shape: item ${g.id ?? "?"} missing "${f}"`);
      }
    }
    if (typeof g.price !== "number" || typeof g.rating !== "number") {
      throw new Error(`Games API shape: item ${g.id} has non-numeric price/rating`);
    }
    if (!Array.isArray(g.imageUrls)) {
      throw new Error(`Games API shape: item ${g.id} imageUrls is not an array`);
    }
  }
  return { items, totalCount, totalPages };
}

/**
 * Whole catalog, server-side only (the API sends no CORS headers, so the
 * browser can never fetch it directly). Cached per Cache Components with a
 * 1h lifetime. The cached CORE throws on transport failure — a thrown
 * result is never cached, so a cold backend cannot poison the catalog with
 * a fake empty list (that bug served a stale error state for hours). The
 * uncached wrapper returns null = "down right now": the landing page
 * degrades with `?? []`, the catalog page shows its honest error state,
 * and the very next request recovers.
 *
 * Import from server components only: `formatPrice`/`heroArtUrl` live in
 * `./format` for client components.
 */
async function fetchAllGamesCore(): Promise<Game[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 3600, expire: 86_400 });
  const res = await fetch(`${API_BASE}/api/Games?page=1&pageSize=100`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Games API ${res.status}`);
  const json = (await res.json()) as ApiEnvelope<PagedGames>;
  return assertPagedGames(json).items;
}

export async function fetchAllGames(): Promise<Game[] | null> {
  try {
    return await fetchAllGamesCore();
  } catch (err) {
    console.error("fetchAllGames failed:", err);
    return null;
  }
}

/** Catalog query params the live API actually supports (all verified):
 *  page, pageSize, search, sortBy=name|price|rating, sortOrder, genre. */
export interface CatalogQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  genre?: string;
}

/**
 * Paged/searchable catalog slice, server-only. Builds the query string
 * from the params the API verifies support, caches each distinct query
 * for 1h. An out-of-range page returns an honest empty item list (the
 * page clamps and redirects rather than showing a fake page). The cached
 * CORE throws on transport/contract failure (never cached); the uncached
 * wrapper returns null = "down right now" so the page shows its honest
 * error state and recovers on the next request.
 */
async function fetchGamesPageCore(q: CatalogQuery): Promise<PagedGames> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 3600, expire: 86_400 });
  const params = new URLSearchParams();
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.search) params.set("search", q.search);
  if (q.sortBy) params.set("sortBy", q.sortBy);
  if (q.sortOrder) params.set("sortOrder", q.sortOrder);
  if (q.genre) params.set("genre", q.genre);
  const res = await fetch(`${API_BASE}/api/Games?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Games API ${res.status}`);
  const json = (await res.json()) as ApiEnvelope<PagedGames>;
  return assertPagedGames(json);
}

export async function fetchGamesPage(q: CatalogQuery): Promise<PagedGames | null> {
  try {
    return await fetchGamesPageCore(q);
  } catch (err) {
    console.error("fetchGamesPage failed:", err);
    return null;
  }
}

/**
 * Single title by id, server-only. 404/400 from the API means the title
 * truly does not exist → null (the page calls notFound()); transport
 * failures rethrow so the route's error boundary tells the truth instead
 * of pretending the game was delisted.
 */
export async function fetchGame(id: number): Promise<Game | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 3600, expire: 86_400 });
  const res = await fetch(`${API_BASE}/api/Games/${id}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`Game API ${res.status}`);
  // unlike the list endpoint, the detail endpoint returns the bare game
  const game = (await res.json()) as Game;
  if (!game || typeof game.id !== "number" || typeof game.name !== "string") {
    throw new Error("Game API shape: detail response missing id/name");
  }
  return game;
}
