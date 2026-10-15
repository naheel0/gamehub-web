import type { MetadataRoute } from "next";
import { fetchAllGames } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

// Public surface only: marketing + legal + catalog. Private money paths
// (cart, checkout, order confirmation, profile) and API routes stay out.
const STATIC_PATHS = [
  "/",
  "/games",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/cookies",
  "/payments",
  "/refunds",
  "/shipping",
  "/cancellation",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const priority = (path: string) =>
    path === "/" ? 1 : path === "/games" ? 0.8 : 0.5;

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/games" ? "weekly" : "monthly",
    priority: priority(path),
  }));

  // null = backend down right now → ship the static routes, never fail build
  const games = (await fetchAllGames()) ?? [];
  const gameEntries: MetadataRoute.Sitemap = games.map((g) => ({
    url: `${SITE_URL}/games/${g.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...gameEntries];
}
