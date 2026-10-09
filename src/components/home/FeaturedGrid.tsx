import Image from "next/image";
import Link from "next/link";
import { Star } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/format";
import type { Game } from "@/lib/types";

export default function FeaturedGrid({
  games,
  heading = "Top of the arena",
  eyebrow = "Highest rated in the live catalog",
}: {
  games: Game[];
  heading?: string;
  eyebrow?: string;
}) {
  return (
    <section id="featured" className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-heading pb-6">
        <h2 className="font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-none uppercase">
          {heading}
        </h2>
        <p className="text-sm text-muted">{eyebrow}</p>
      </div>

      {games.length === 0 ? (
        <p className="mt-10 border border-line bg-surface p-6 text-text">
          The catalog did not load — the GameHub API may be starting up. Refresh in a moment and
          the titles will return.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <Reveal key={g.id} delay={i * 0.07} y={30} className="h-full">
              <Link href={`/games/${g.id}`} className="group block h-full">
                <article className="h-full border border-line bg-surface transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/60 group-hover:shadow-xl">
                <div className="relative aspect-video overflow-hidden">
                  {g.imageUrls[0] && (
                    <Image
                      src={g.imageUrls[0]}
                      alt={`${g.name} cover art`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  {!g.inStock && (
                    <span className="absolute top-3 left-3 border border-line bg-bg/90 px-2.5 py-1 font-mono text-[11px] tracking-widest text-muted uppercase">
                      Sold out
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">{g.genre}</p>
                  <h3 className="mt-2 font-display text-2xl leading-tight uppercase">
                    {g.name}
                  </h3>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <span className="font-mono text-lg font-bold text-accent">
                      {formatPrice(g.price)}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-heading">
                      <Star className="h-4 w-4 text-accent" weight="fill" />
                      {g.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
