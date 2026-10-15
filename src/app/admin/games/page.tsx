import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import { adminGamesPage } from "@/lib/admin/fetch";
import { formatPrice } from "@/lib/format";

// adminGamesPage reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "Games — Admin" };

const PAGE_SIZE = 15;
const SORT_COLS = ["name", "price", "rating"] as const;
type SortCol = (typeof SORT_COLS)[number];
type Dir = "asc" | "desc";

type Search = { q?: string; sort?: string; dir?: string; page?: string };

/** Sortable header: real link, URL carries sort+dir, page resets (aria-sort
 *  announces direction — the glyph is decoration, never the only signal). */
function SortTh({
  col,
  label,
  sort,
  dir,
  hrefFor,
  align = "left",
}: {
  col: SortCol;
  label: string;
  sort: SortCol;
  dir: Dir;
  hrefFor: (col: SortCol, dir: Dir) => string;
  align?: "left" | "right";
}) {
  const active = sort === col;
  const nextDir: Dir = active && dir === "asc" ? "desc" : "asc";
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-normal ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Link
        href={hrefFor(col, nextDir)}
        className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-accent"
      >
        {label}
        {active && (
          <span aria-hidden="true" className="text-accent">
            {dir === "asc" ? "▲" : "▼"}
          </span>
        )}
      </Link>
    </th>
  );
}

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort: SortCol = SORT_COLS.includes(sp.sort as SortCol) ? (sp.sort as SortCol) : "name";
  const dir: Dir = sp.dir === "desc" ? "desc" : "asc";
  const pageRaw = Number(sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  // all state lives in the URL; defaults stay out of it
  const paramsFor = (opts?: { q?: string; sort?: SortCol; dir?: Dir; page?: number }) => {
    const p = new URLSearchParams();
    const qq = opts?.q ?? q;
    const ss = opts?.sort ?? sort;
    const dd = opts?.dir ?? dir;
    if (qq) p.set("q", qq);
    if (ss !== "name" || dd !== "asc") p.set("sort", ss);
    if (dd !== "asc") p.set("dir", dd);
    if (opts?.page && opts.page > 1) p.set("page", String(opts.page));
    const s = p.toString();
    return s ? `/admin/games?${s}` : "/admin/games";
  };

  const res = await adminGamesPage({
    page,
    pageSize: PAGE_SIZE,
    search: q || undefined,
    sortBy: sort,
    sortOrder: dir,
  });
  if (res.kind === "denied") redirect("/login?next=/admin/games");
  if (res.kind === "missing") throw new Error("Games list rejected the query.");
  if (res.kind === "unreachable") throw new Error("Couldn't load the games table.");
  const { items, totalCount } = res.data;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // out-of-range page (honest API: empty items + real totalCount) → page 1
  // of the same filtered query, not a bare reset
  if (items.length === 0 && page > 1 && totalCount > 0) redirect(paramsFor({ page: 1 }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            Catalog control
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-[0.02em] text-heading uppercase sm:text-6xl">
            Games
          </h1>
        </div>
        <form method="get" role="search" className="flex items-center gap-2">
          <label htmlFor="games-q" className="sr-only">
            Search games
          </label>
          <input
            id="games-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            className="h-10 w-52 border border-line bg-bg px-3 font-mono text-sm text-text placeholder:text-muted"
          />
          <button
            type="submit"
            className="h-10 shrink-0 border border-line px-4 font-mono text-xs tracking-[0.14em] text-heading uppercase transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Search
          </button>
          {q && (
            <Link
              href={paramsFor({ q: "" })}
              className="font-mono text-xs text-muted underline underline-offset-4 transition-colors duration-200 hover:text-accent"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <p className="mt-4 font-mono text-xs text-muted">
        {totalCount} {totalCount === 1 ? "title" : "titles"}
        {q ? ` matching “${q}”` : ""}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 border border-line bg-surface/60 p-8 text-center">
          <p className="font-display text-2xl text-heading uppercase">No games match{q ? ` “${q}”` : ""}</p>
          <Link
            href="/admin/games"
            className="mt-5 inline-flex h-10 items-center border border-line px-5 font-mono text-xs tracking-[0.14em] text-heading uppercase transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Clear search
          </Link>
        </div>
      ) : (
        <>
          {/* contain-paint: without it this table's width propagates to the
              root and the whole page becomes horizontally swipeable at 390px
              (verified: Chromium counts the inner table's width for the
              document's scrollWidth even though the scroller clips it) */}
          <div className="mt-6 overflow-x-auto contain-paint border border-line bg-surface/60">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  <SortTh
                    col="name"
                    label="Game"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <th scope="col" className="px-4 py-3 text-left font-normal">
                    Genre
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-normal">
                    Platform
                  </th>
                  <SortTh
                    col="price"
                    label="Price"
                    sort={sort}
                    dir={dir}
                    align="right"
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="rating"
                    label="Rating"
                    sort={sort}
                    dir={dir}
                    align="right"
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <th scope="col" className="px-4 py-3 text-left font-normal">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-bg/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="block h-12 w-9 shrink-0 overflow-hidden border border-line bg-bg">
                          {g.imageUrls[0] ? (
                            <Image
                              src={g.imageUrls[0]}
                              alt=""
                              width={36}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="font-semibold text-heading">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{g.genre}</td>
                    <td className="px-4 py-2.5 text-muted">{g.platform}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-accent">
                      {formatPrice(g.price)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-text">
                      {g.rating}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="border border-line px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
                        {g.inStock ? "In stock" : "Out of stock"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/admin/games/${g.id}`}
                        className="font-mono text-xs tracking-[0.1em] text-heading uppercase underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CatalogPagination page={page} totalPages={totalPages} hrefFor={(p) => paramsFor({ page: p })} />
        </>
      )}
    </div>
  );
}
