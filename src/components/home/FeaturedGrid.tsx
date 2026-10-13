import Reveal from "@/components/ui/Reveal";
import GameCard from "@/components/game/GameCard";
import type { Game } from "@/lib/types";

export default function FeaturedGrid({
  games,
  heading = "Top of the arena",
  eyebrow = "Highest rated in the live catalog",
  actions = false,
}: {
  games: Game[];
  heading?: string;
  eyebrow?: string;
  /** Opt-in quick cart/wishlist actions on each card (related rail). */
  actions?: boolean;
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
          We couldn&apos;t load the catalog right now. Refresh in a moment and the titles
          will return.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <Reveal key={g.id} delay={i * 0.07} y={30} className="h-full">
              <GameCard game={g} actions={actions} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
