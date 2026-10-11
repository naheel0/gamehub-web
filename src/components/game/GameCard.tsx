import Image from "next/image";
import Link from "next/link";
import { Star } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import type { Game } from "@/lib/types";

/**
 * The catalog card (one grammar everywhere): cover art, genre label,
 * display title, price + rating data strip. Showcase `article` inside a
 * link — a card is not a control.
 */
export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="group block h-full">
      <article className="h-full border border-line bg-surface transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/60 group-hover:shadow-xl">
        <div className="relative aspect-video overflow-hidden">
          {game.imageUrls[0] && (
            <Image
              src={game.imageUrls[0]}
              alt={`${game.name} cover art`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          {!game.inStock && (
            <span className="absolute top-3 left-3 border border-line bg-bg/90 px-2.5 py-1 font-mono text-[11px] tracking-widest text-muted uppercase">
              Sold out
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">
            {game.genre}
          </p>
          <h3 className="mt-2 font-display text-2xl leading-tight uppercase">
            {game.name}
          </h3>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-mono text-lg font-bold text-accent">
              {formatPrice(game.price)}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-heading">
              <Star className="h-4 w-4 text-accent" weight="fill" />
              {game.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
