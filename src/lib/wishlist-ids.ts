"use client";

import { useEffect, useSyncExternalStore } from "react";
import { storeCall } from "@/lib/store";
import type { WishlistItem } from "@/lib/types";

/**
 * One wishlist lookup per page load, shared by every consumer (grid cards
 * and the buy box): ids live in a module-level Set that all hearts
 * subscribe to (useSyncExternalStore — SSR renders the neutral outline, no
 * hydration mismatch). A `counts:changed` event (any mutation anywhere)
 * drops the cache and re-reads, so hearts never drift between surfaces
 * while signed in. 401/failure leaves the null snapshot — heart rows gate
 * or stay neutral, never fake.
 */
let ids: Set<number> | null = null;
let idsPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Set<number>) {
  ids = next;
  listeners.forEach((l) => l());
}

function loadIds(): Promise<void> {
  idsPromise ??= storeCall<WishlistItem[]>("GET", "/api/wishlist").then((r) => {
    const next = new Set<number>();
    if (r.ok && Array.isArray(r.data)) for (const i of r.data) next.add(i.gameId);
    publish(next);
  });
  return idsPromise;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

// ponytail: one GET per mutation (every announce triggers a re-read);
// per-action diffing only if the re-read traffic ever shows up
if (typeof window !== "undefined") {
  window.addEventListener("counts:changed", () => {
    if (idsPromise) {
      idsPromise = null;
      void loadIds();
    }
  });
}

export function useWishlistIds(): Set<number> | null {
  // snapshot = the Set reference itself (publish swaps in a fresh one) —
  // a boolean "resolved" flag would never change after a toggle and
  // React would skip the re-render that flips the hearts
  const current = useSyncExternalStore(
    subscribe,
    () => ids,
    () => null,
  );
  useEffect(() => {
    void loadIds(); // deduped — the promise is shared across every consumer
  }, []);
  return current;
}

/** another surface just mutated the wishlist — refresh the shared truth */
export function refreshWishlistIds() {
  if (idsPromise) {
    idsPromise = null;
    void loadIds();
  }
}
