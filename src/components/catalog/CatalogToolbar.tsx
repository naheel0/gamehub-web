"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X } from "@/components/ui/icons";
import CountUp from "@/components/ui/CountUp";
import { SORTS, DEFAULT_SORT, sortKeyOf, type SortKey } from "@/lib/catalog";

/**
 * Catalog command strip (Pinterest refs: illuminated search on dark,
 * HUD filter bars). Search glows crimson on focus, genre chips are
 * hairline tabs with an accent underline on active, sort is a mono
 * select. Behavior unchanged: 300ms debounce → router.replace (server
 * re-renders — every request stays server-side where the CORS-blocked
 * API is reachable); all state lives in the URL.
 */
export default function CatalogToolbar({
  q,
  genre,
  sort,
  genres,
  resultCount,
}: {
  q: string;
  genre: string;
  sort: SortKey;
  genres: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const first = useRef(true);

  const href = (next: { q?: string; genre?: string; sort?: SortKey; page?: number }) => {
    const p = new URLSearchParams();
    const nq = (next.q ?? q).trim();
    if (nq) p.set("q", nq);
    const ng = next.genre ?? genre;
    if (ng) p.set("genre", ng);
    const ns = next.sort ?? sort;
    if (ns !== DEFAULT_SORT) p.set("sort", ns);
    if (next.page && next.page > 1) p.set("page", String(next.page));
    const s = p.toString();
    return s ? `/games?${s}` : "/games";
  };

  // debounced search → URL
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => router.replace(href({ q: text }), { scroll: false }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- href closes over current props; rerun on text change only
  }, [text]);

  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="border border-line bg-surface/80">
      {/* search + sort row */}
      <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="group relative flex-1">
          <MagnifyingGlass
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-200 group-focus-within:text-accent"
          />
          <input
            ref={input}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.replace(href({ q: text }), { scroll: false });
              if (e.key === "Escape") setText("");
            }}
            placeholder="Search the catalog…"
            aria-label="Search games"
            className="h-12 w-full border border-line bg-bg pr-11 pl-11 font-mono text-sm tracking-[0.04em] text-heading transition-shadow duration-200 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent),0_0_24px_-6px_var(--color-accent)] focus:outline-none"
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                input.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted transition-colors duration-200 hover:text-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="catalog-sort"
            className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase"
          >
            Sort
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) =>
              router.replace(href({ sort: sortKeyOf(e.target.value) }), { scroll: false })
            }
            className="h-12 border border-line bg-bg px-3 font-mono text-xs tracking-[0.1em] text-heading uppercase focus:border-accent focus:outline-none"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* genre tabs: hairline row, accent underline on active (HUD tabs) */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 p-4 sm:p-5">
        <span className="mr-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          Genre
        </span>
        {[["", "All"], ...genres.map((g) => [g, g] as const)].map(([value, label]) => {
          const active = genre === value;
          return (
            <button
              key={value || "all"}
              type="button"
              onClick={() => router.replace(href({ genre: value }), { scroll: false })}
              aria-pressed={active}
              className={`relative px-3 py-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 ${
                active ? "text-heading" : "text-muted hover:text-heading"
              }`}
            >
              {label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 bottom-0 h-px bg-accent transition-transform duration-200 ${
                  active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
        <span className="ml-auto pl-3 font-mono text-[11px] tabular-nums text-muted">
          <span className="text-accent">
            <CountUp value={resultCount} duration={0.5} />
          </span>{" "}
          {resultCount === 1 ? "title" : "titles"}
        </span>
      </div>
    </div>
  );
}
