"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCartSimple, Trash } from "@/components/ui/icons";
import { HeartArt } from "@/components/ui/EmptyArt";
import { formatPrice } from "@/lib/format";
import { announceCounts, storeCall } from "@/lib/store";
import type { WishlistItem } from "@/lib/types";

/**
 * The wishlist body: resolves once after mount (pending ≠ signed out), then
 * rows with Move to cart / Remove. Every mutation announces `counts:changed`
 * so the navbar badges follow without a second source of truth. Empty, gate
 * and failure states are their own copy — never a fake empty list.
 */
type State =
  | { k: "loading" }
  | { k: "gate" }
  | { k: "error"; message: string }
  | { k: "ready"; items: WishlistItem[] };

export default function WishlistClient() {
  const [state, setState] = useState<State>({ k: "loading" });
  const [busy, setBusy] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    storeCall<WishlistItem[]>("GET", "/api/wishlist").then((r) => {
      if (!live) return;
      if (r.ok) setState({ k: "ready", items: Array.isArray(r.data) ? r.data : [] });
      else if (r.status === 401) setState({ k: "gate" });
      else setState({ k: "error", message: r.message });
    });
    return () => {
      live = false;
    };
  }, []);

  const retry = () => {
    setState({ k: "loading" });
    setFlash(null);
    storeCall<WishlistItem[]>("GET", "/api/wishlist").then((r) => {
      if (r.ok) setState({ k: "ready", items: Array.isArray(r.data) ? r.data : [] });
      else if (r.status === 401) setState({ k: "gate" });
      else setState({ k: "error", message: r.message });
    });
  };

  const act = async (item: WishlistItem, action: "move" | "remove") => {
    if (busy !== null) return;
    setBusy(item.gameId);
    const r =
      action === "move"
        ? await storeCall<{ message: string }>("POST", `/api/wishlist/${item.gameId}/move-to-cart`)
        : await storeCall<{ message: string }>("DELETE", `/api/wishlist/${item.gameId}`);
    setBusy(null);
    if (!r.ok) {
      if (r.status === 401) setState({ k: "gate" });
      else setFlash(r.message);
      return;
    }
    announceCounts();
    setState((s) =>
      s.k === "ready" ? { ...s, items: s.items.filter((i) => i.gameId !== item.gameId) } : s,
    );
    setFlash(
      action === "move"
        ? `${item.gameName} moved to your cart.`
        : `${item.gameName} removed from your wishlist.`,
    );
  };

  if (state.k === "loading") {
    return (
      <div className="grid gap-3 sm:gap-4" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex animate-pulse gap-4 border border-line bg-surface p-3 motion-reduce:animate-none sm:gap-5 sm:p-4"
          >
            <div className="aspect-video w-28 shrink-0 bg-bg sm:w-44" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 w-2/3 bg-line" />
              <div className="h-6 w-24 bg-line" />
              <div className="h-9 w-40 bg-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (state.k === "gate") {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <Heart className="mx-auto h-8 w-8 text-accent" weight="fill" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">Sign in to see your wishlist</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Your saved titles live with your account — sign in and they&apos;ll be right here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center bg-accent px-6 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Sign in
          </Link>
          <Link
            href="/games"
            className="inline-flex h-11 items-center border border-line px-6 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Browse the store
          </Link>
        </div>
      </div>
    );
  }

  if (state.k === "error") {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <h2 className="font-display text-3xl uppercase">We couldn&apos;t load your wishlist</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex h-11 items-center border border-accent px-6 font-semibold text-accent transition-colors duration-200 hover:bg-accent hover:text-bg"
        >
          Try again
        </button>
      </div>
    );
  }

  const { items } = state;

  return (
    <div>
      {flash && (
        <p role="status" className="mb-4 border-l-2 border-accent/60 bg-surface px-4 py-2.5 font-mono text-xs text-muted">
          {flash}
        </p>
      )}

      {items.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-12 text-center">
          <HeartArt className="mx-auto h-16 w-16" />
          <h2 className="mt-4 font-display text-3xl uppercase">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-text">
            Tap the heart on any title and it waits here until you&apos;re ready.
          </p>
          <Link
            href="/games"
            className="mt-6 inline-flex h-11 items-center bg-accent px-6 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Browse the store
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:gap-4">
          {items.map((item, i) => (
            <li key={item.gameId} className="deal-in" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <article className="group flex gap-4 border border-line bg-surface p-3 transition-colors duration-200 hover:border-accent/50 sm:gap-5 sm:p-4">
                <Link
                  href={`/games/${item.gameId}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="relative aspect-video w-28 shrink-0 overflow-hidden border border-line bg-bg sm:w-44"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 176px, 112px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid-floor block h-full w-full" />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/games/${item.gameId}`}
                    className="font-display text-xl leading-tight uppercase text-heading transition-colors duration-200 hover:text-accent sm:text-2xl"
                  >
                    {item.gameName}
                  </Link>
                  <p className="mt-1 font-mono text-lg font-bold tabular-nums text-accent sm:text-xl">
                    {formatPrice(item.price)}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2 pt-3 sm:gap-3">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void act(item, "move")}
                      className="inline-flex h-10 items-center gap-2 bg-accent px-4 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <ShoppingCartSimple className="h-4 w-4" weight="bold" aria-hidden />
                      {busy === item.gameId ? "Moving…" : "Move to cart"}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void act(item, "remove")}
                      className="inline-flex h-10 items-center gap-2 border border-line px-4 font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash className="h-4 w-4" weight="bold" aria-hidden />
                      {busy === item.gameId ? "Working…" : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
