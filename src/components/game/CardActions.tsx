"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Heart, ShoppingCartSimple } from "@/components/ui/icons";
import { flyToCart } from "@/components/ui/FlyCoin";
import { announceCounts, storeCall } from "@/lib/store";
import { useWishlistIds, refreshWishlistIds } from "@/lib/wishlist-ids";

/**
 * Quick cart + wishlist actions for grid cards (catalog + related rail).
 * Same honest contract as BuyBox: the heart only fills after the server
 * agrees, every mutation announces `counts:changed` for the navbar
 * badges, 401 routes to sign-in with a `?next=` back-link — no fake
 * optimistic state anywhere. Wishlist ids ride the one shared store
 * (lib/wishlist-ids): a 24-card grid is one request, not 24.
 */

export default function CardActions({
  id,
  name,
  inStock,
}: {
  id: number;
  name: string;
  inStock: boolean;
}) {
  const router = useRouter();
  const savedIds = useWishlistIds();
  const [busy, setBusy] = useState<null | "cart" | "wish">(null);
  const [added, setAdded] = useState(false);
  const saved = savedIds?.has(id) ?? false;

  const gate = () => {
    const path = window.location.pathname + window.location.search;
    router.push(`/login?next=${encodeURIComponent(path)}`);
  };

  const addToCart = async (btn: HTMLElement) => {
    if (busy) return;
    setBusy("cart");
    const r = await storeCall<{ message: string }>("POST", "/api/cart", {
      gameId: id,
      quantity: 1,
    });
    setBusy(null);
    if (!r.ok) {
      if (r.status === 401) gate();
      return;
    }
    announceCounts();
    flyToCart(btn);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const toggleWishlist = async () => {
    if (busy || !savedIds) return;
    const adding = !saved;
    setBusy("wish");
    const r = await storeCall<{ message: string }>(
      adding ? "POST" : "DELETE",
      `/api/wishlist/${id}`,
    );
    setBusy(null);
    if (!r.ok) {
      if (r.status === 401) gate();
      return;
    }
    // the shared store re-reads on counts:changed; the local publish was only
    // ever a stopgap — server truth now updates every heart
    refreshWishlistIds();
    announceCounts();
  };

  return (
    <div
      role="group"
      aria-label={`Actions for ${name}`}
      className="flex items-center gap-2"
    >
      <span aria-live="polite" className="sr-only">
        {added ? `${name} added to your cart` : ""}
      </span>
      <button
        type="button"
        onClick={(e) => void addToCart(e.currentTarget)}
        disabled={!inStock || busy !== null}
        aria-label={
          added ? `${name} is in your cart` : `Add ${name} to cart`
        }
        className="flex h-9 w-9 items-center justify-center border border-line text-muted transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted"
      >
        {added ? (
          <CheckCircle
            className="h-4 w-4 text-accent badge-pop"
            weight="fill"
            aria-hidden
          />
        ) : (
          <ShoppingCartSimple className="h-4 w-4" weight="bold" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={() => void toggleWishlist()}
        disabled={busy !== null || savedIds === null}
        aria-pressed={saved}
        aria-label={
          saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`
        }
        className="flex h-9 w-9 items-center justify-center border border-line transition-colors duration-200 hover:border-accent disabled:cursor-wait disabled:opacity-50"
      >
        <Heart
          className={`h-4 w-4 transition-colors duration-200 ${saved ? "text-accent heart-pop" : "text-muted"}`}
          weight={saved ? "fill" : "regular"}
          aria-hidden
        />
      </button>
    </div>
  );
}
