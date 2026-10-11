import Link from "next/link";
import { CaretLeft, CaretRight } from "@/components/ui/icons";

/**
 * Page-number pagination as real links (shareable, crawlable, no JS).
 * Renders nothing for a single page; pages beyond range never render as
 * active. Query state (q/genre/sort) is carried by the caller-built href.
 */
export default function CatalogPagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const nums = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Catalog pages"
      className="mt-12 flex items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="flex h-11 w-11 items-center justify-center border border-line text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          <CaretLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span className="flex h-11 w-11 items-center justify-center border border-line text-muted opacity-40">
          <CaretLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      )}

      {nums.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className="flex h-11 min-w-11 items-center justify-center border border-accent bg-accent px-2 font-mono text-sm font-bold tabular-nums text-bg"
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            className="flex h-11 min-w-11 items-center justify-center border border-line font-mono text-sm tabular-nums text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            {n}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="flex h-11 w-11 items-center justify-center border border-line text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          <CaretRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span className="flex h-11 w-11 items-center justify-center border border-line text-muted opacity-40">
          <CaretRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
