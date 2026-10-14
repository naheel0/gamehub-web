import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

interface GenreItem {
  genre: string;
  count: number;
}

/**
 * Genre chips are real controls: counts come straight from the catalog and
 * each chip deep-links into the URL-backed genre filter on /games (raw
 * genre strings, encoded — the toolbar reads the same values).
 */
export default function GenreRail({ items }: { items: GenreItem[] }) {
  if (items.length === 0) return null;

  return (
    <section
      id="genres"
      className="border-y border-line bg-bg-soft py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-none uppercase">
            Shop by genre
          </h2>
          <p className="text-sm text-muted">Counts straight from the live catalog</p>
        </div>
        <Reveal className="mt-8">
          <ul className="flex flex-wrap gap-3">
            {items.map((g) => (
              <li key={g.genre}>
                <Link
                  href={`/games?genre=${encodeURIComponent(g.genre)}`}
                  className="flex items-center gap-3 border border-line bg-surface px-4 py-2.5 text-sm tracking-wider text-heading uppercase transition-colors duration-200 hover:border-accent hover:text-accent focus:border-accent focus:outline-none"
                >
                  {g.genre}
                  <span className="font-mono text-xs font-bold text-accent">{g.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
