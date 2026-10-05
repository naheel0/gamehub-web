import { formatPrice } from "@/lib/format";
import type { Game } from "@/lib/types";

/** Arena ticker: every title + live price. Decorative repetition — hidden from AT. */
export default function Ticker({ games }: { games: Game[] }) {
  if (games.length === 0) return null;

  const row = () => (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
      {games.map((g) => (
        <span key={g.id} className="flex items-center gap-3 whitespace-nowrap text-sm uppercase">
          <span className="tracking-widest text-heading">{g.name}</span>
          <span className="font-mono font-bold text-accent">{formatPrice(g.price)}</span>
          <span className="text-accent" aria-hidden="true">
            /
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-line bg-bg-soft py-3.5">
      <div className="marquee-track flex w-max">
        {row()}
        {row()}
      </div>
    </div>
  );
}
