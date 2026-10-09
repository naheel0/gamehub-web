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
 * 1h lifetime; failures degrade to an empty list so a cold backend cannot
 * fail the build — the page then renders its honest empty state.
 *
 * Import from server components only: `formatPrice`/`heroArtUrl` live in
 * `./format` for client components.
 */
export async function fetchAllGames(): Promise<Game[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 3600, expire: 86_400 });
  try {
    const res = await fetch(`${API_BASE}/api/Games?page=1&pageSize=100`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Games API ${res.status}`);
    const json = (await res.json()) as ApiEnvelope<PagedGames>;
    return assertPagedGames(json).items;
  } catch (err) {
    console.error("fetchAllGames failed:", err);
    return [];
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
