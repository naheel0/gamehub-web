"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCartSimple, Star } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";

/**
 * E-com buy box (Flpkart/Amazon grammar, Crimson Arena skin): title, star
 * rating, stock badge, big price, genre/platform, description, quantity
 * stepper, Add to Cart + Buy Now. The live API guards /Cart and /Orders
 * behind JWT auth (401 verified, no login exists in this frontend yet),
 * so the actions state that honestly instead of faking a cart — no
 * invented policies or links.
 */
export default function BuyBox({
  name,
  genre,
  platform,
  price,
  rating,
  inStock,
  description,
}: {
  name: string;
  genre: string;
  platform: string;
  price: number;
  rating: number;
  inStock: boolean;
  description?: string;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState<string | null>(null);

  const gated = () =>
    setNote(
      "Cart and checkout are almost here — accounts open first. Check back shortly to place your order.",
    );

  const stars = Math.round(rating);

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
        {genre}
      </p>
      <h1 className="mt-2 font-display text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[0.95] text-balance uppercase">
        {name}
      </h1>

      {/* rating row: stars + score + stock badge */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={s <= stars ? "text-accent" : "text-line"}
              weight="fill"
            />
          ))}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {rating.toFixed(1)}/5
        </span>
        <span
          className={`border px-2 py-0.5 font-mono text-[11px] tracking-[0.1em] uppercase ${
            inStock
              ? "border-accent/50 text-accent"
              : "border-line text-muted"
          }`}
        >
          {inStock ? "In stock" : "Sold out"}
        </span>
      </div>

      {/* price */}
      <p className="mt-5 font-mono text-4xl leading-none font-bold tabular-nums text-accent">
        {formatPrice(price)}
      </p>

      {/* genre / platform */}
      <dl className="mt-6 grid grid-cols-2 gap-y-4 border-y border-line py-4 font-mono text-xs tracking-[0.12em] uppercase">
        <div>
          <dt className="text-muted">Genre</dt>
          <dd className="mt-1 text-heading">{genre}</dd>
        </div>
        <div>
          <dt className="text-muted">Platform</dt>
          <dd className="mt-1 text-heading">{platform}</dd>
        </div>
      </dl>

      {description && (
        <p className="mt-5 max-w-[62ch] text-text">{description}</p>
      )}

      {/* quantity stepper */}
      <div className="mt-7 flex items-center gap-4">
        <span className="font-mono text-xs tracking-[0.12em] text-muted uppercase">
          Quantity
        </span>
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-muted transition-colors duration-200 hover:text-accent disabled:opacity-40 disabled:hover:text-muted"
          >
            <Minus className="h-4 w-4" weight="bold" />
          </button>
          <span
            aria-live="polite"
            className="w-10 text-center font-mono text-sm font-bold tabular-nums text-heading"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-muted transition-colors duration-200 hover:text-accent"
          >
            <Plus className="h-4 w-4" weight="bold" />
          </button>
        </div>
      </div>

      {/* actions */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={gated}
          disabled={!inStock}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:hover:translate-y-0"
        >
          <ShoppingCartSimple className="h-5 w-5" weight="bold" />
          Add to cart
        </button>
        <button
          type="button"
          onClick={gated}
          disabled={!inStock}
          className="inline-flex h-12 flex-1 items-center justify-center border-2 border-heading px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
        >
          Buy now
        </button>
      </div>

      {/* honest gate notice (role=status: announced on click) */}
      {note && (
        <p
          role="status"
          className="mt-4 max-w-[62ch] border-l-2 border-accent/60 bg-surface px-4 py-2.5 font-mono text-xs leading-relaxed text-muted"
        >
          {note}
        </p>
      )}
    </div>
  );
}
