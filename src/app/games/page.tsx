import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/ui/Reveal";
import { ArrowLeft } from "@/components/ui/icons";
import GameCard from "@/components/game/GameCard";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import Tilt from "@/components/ui/Tilt";
import { SORTS, DEFAULT_SORT, sortKeyOf } from "@/lib/catalog";
import { fetchAllGames, fetchGamesPage } from "@/lib/api";

export const metadata: Metadata = {
  title: "All games — GameHub",
  description:
    "Browse the full GameHub catalog — every title, rating and INR price. Search, sort and filter by genre.",
};

const PAGE_SIZE = 12;

type Search = { q?: string; genre?: string; sort?: string; page?: string };

/** Static shell: the PPR shell renders instantly; the catalog body
 *  (searchParams-driven) streams in behind a skeleton. */
export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <>
      <Navbar />
      <main id="top">
        <div className="mx-auto w-full max-w-7xl px-5 pt-28 pb-24 sm:px-8">
          {/* arena header: glow + oversized display + sweep line */}
          <div className="relative isolate overflow-hidden border-b-2 border-heading pb-8">
            <div
              aria-hidden="true"
              className="dither-glow pointer-events-none absolute -top-32 -right-24 -z-10 h-[420px] w-[420px] opacity-70"
            />
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the arena
            </Link>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.9] tracking-[-0.02em] uppercase">
                All <span className="text-accent">games</span>
              </h1>
            </div>
            {/* signature sweep: runs once per mount (page load) */}
            <div
              aria-hidden="true"
              className="sweep-run absolute inset-x-0 bottom-0 h-px bg-accent opacity-0 shadow-[0_0_14px_1px_rgb(255_45_85_/_0.7)]"
            />
          </div>

          <Suspense
            fallback={
              <div className="mt-8" aria-busy="true" aria-label="Loading catalog">
                <CatalogSkeleton />
              </div>
            }
          >
            <CatalogBody searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Layout-preserving skeleton: same rhythm as toolbar + grid (skill:
 *  Loading Indicators — stable skeleton, no flicker, aria-busy). */
function CatalogSkeleton() {
  return (
    <div>
      <div className="border border-line bg-surface">
        <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:p-5">
          <div className="h-11 flex-1 animate-pulse bg-bg" />
          <div className="h-11 w-44 animate-pulse bg-bg" />
        </div>
        <div className="flex flex-wrap gap-2 p-4 sm:p-5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-8 w-16 animate-pulse bg-bg" />
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}

/** All filter state lives in the URL → shareable, back/forward works. */
async function CatalogBody({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const genre = (sp.genre ?? "").trim().slice(0, 40);
  const sort = sortKeyOf(sp.sort ?? null);
  const pageRaw = Number(sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const { sortBy, sortOrder } = SORTS[sort];
  const result = await fetchGamesPage({
    page,
    pageSize: PAGE_SIZE,
    search: q || undefined,
    genre: genre || undefined,
    sortBy,
    sortOrder,
  });
  const items = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (sort !== DEFAULT_SORT) params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/games?${s}` : "/games";
  };

  // out-of-range page (honest API: empty items + real totalCount) → page 1
  // of the same filtered query, not a bare reset
  if (items.length === 0 && page > 1 && totalCount > 0) redirect(hrefFor(1));

  // genre chips come from the real catalog, not a hardcoded list
  const all = await fetchAllGames();
  const genres = all ? [...new Set(all.map((g) => g.genre))].sort() : [];

  // null = the catalog is down right now (never a cached lie)
  const down = result === null || all === null;

  return (
    <>
      {/* the shell's "Live catalog" line is replaced by the real count here */}
      <div className="mt-8">
        <CatalogToolbar
          q={q}
          genre={genre}
          sort={sort}
          genres={genres}
          resultCount={totalCount}
        />
      </div>

      {down ? (
        /* honest error state — customer tone, no backend internals */
        <p className="mt-10 border border-line bg-surface p-6 text-text">
          We couldn&apos;t load the catalog right now. Refresh in a moment and the titles
          will return.
        </p>
      ) : items.length === 0 ? (
        /* no dead ends: name the query and offer the way out (skill: Search/No Results) */
        <div className="mt-10 border border-line bg-surface p-8 text-center">
          <p className="font-display text-2xl text-heading uppercase">
            No games match{q ? ` “${q}”` : " these filters"}
          </p>
          <p className="mt-2 text-sm text-muted">
            Try a different title, or clear the filters to see all {all?.length ?? 0}.
          </p>
          <Link
            href="/games"
            className="mt-6 inline-flex h-12 items-center border-2 border-heading px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-bg"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((g, i) => (
              <Reveal key={g.id} delay={Math.min(i * 0.05, 0.4)} y={24} className="h-full">
                <Tilt className="h-full">
                  <GameCard game={g} actions />
                </Tilt>
              </Reveal>
            ))}
          </div>

          <CatalogPagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </>
      )}
    </>
  );
}
