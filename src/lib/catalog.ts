/** Catalog sort options → API sortBy/sortOrder (verified live).
 *  Shared by the server page and the client toolbar — no "use client"
 *  boundary here so the server can import it too. */
export const SORTS = {
  "rating-desc": { label: "Top rated", sortBy: "rating", sortOrder: "desc" },
  "price-asc": { label: "Price: low to high", sortBy: "price", sortOrder: "asc" },
  "price-desc": { label: "Price: high to low", sortBy: "price", sortOrder: "desc" },
  "name-asc": { label: "Name: A–Z", sortBy: "name", sortOrder: "asc" },
} as const;

export type SortKey = keyof typeof SORTS;

export const DEFAULT_SORT: SortKey = "rating-desc";

export function sortKeyOf(v: string | null): SortKey {
  return v && v in SORTS ? (v as SortKey) : DEFAULT_SORT;
}
