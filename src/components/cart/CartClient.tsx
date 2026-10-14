"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingCartSimple, Trash } from "@/components/ui/icons";
import { CoinArt } from "@/components/ui/EmptyArt";
import GlbPanel from "@/components/three/GlbPanel";
import { formatPrice } from "@/lib/format";
import { announceCounts, storeCall, type StoreResult } from "@/lib/store";
import type { CartItem } from "@/lib/types";

/**
 * Cart body: lines with a quantity stepper (1–99, resynced from source on a
 * rejected change), a DualShock panel + sticky summary rail, and a live
 * hand-off to /checkout — addresses and payment happen there. Counts
 * announce to the navbar.
 */
type State =
  | { k: "loading" }
  | { k: "gate" }
  | { k: "error"; message: string }
  | { k: "ready"; items: CartItem[] };

export default function CartClient() {
  const [state, setState] = useState<State>({ k: "loading" });
  const [busy, setBusy] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const read = (r: StoreResult<CartItem[]>) => {
    if (r.ok) setState({ k: "ready", items: Array.isArray(r.data) ? r.data : [] });
    else if (r.status === 401) setState({ k: "gate" });
    else setState({ k: "error", message: r.message });
  };

  useEffect(() => {
    let live = true;
    storeCall<CartItem[]>("GET", "/api/cart").then((r) => {
      if (live) read(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const retry = () => {
    setState({ k: "loading" });
    setFlash(null);
    storeCall<CartItem[]>("GET", "/api/cart").then(read);
  };

  const fail = (status: number, message: string) => {
    if (status === 401) setState({ k: "gate" });
    else setFlash(message);
  };

  const setQty = async (item: CartItem, next: number) => {
    if (next < 1 || next > 99 || next === item.quantity || busy !== null) return;
    setBusy(item.gameId);
    const r = await storeCall<{ message: string }>("PUT", `/api/cart/${item.gameId}`, {
      quantity: next,
    });
    setBusy(null);
    if (!r.ok) {
      fail(r.status, r.message);
      // rejected changes (stock moved, qty out of range) resync from source
      storeCall<CartItem[]>("GET", "/api/cart").then((re) => {
        if (re.ok) setState({ k: "ready", items: Array.isArray(re.data) ? re.data : [] });
      });
      return;
    }
    announceCounts();
    setState((s) =>
      s.k === "ready"
        ? { ...s, items: s.items.map((i) => (i.gameId === item.gameId ? { ...i, quantity: next } : i)) }
        : s,
    );
  };

  const remove = async (item: CartItem) => {
    if (busy !== null) return;
    setBusy(item.gameId);
    const r = await storeCall<{ message: string }>("DELETE", `/api/cart/${item.gameId}`);
    setBusy(null);
    if (!r.ok) {
      fail(r.status, r.message);
      return;
    }
    announceCounts();
    setState((s) =>
      s.k === "ready" ? { ...s, items: s.items.filter((i) => i.gameId !== item.gameId) } : s,
    );
    setFlash(`${item.gameName} removed from your cart.`);
  };

  if (state.k === "loading") {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true">
        <div className="grid gap-3 sm:gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex animate-pulse gap-4 border border-line bg-surface p-3 motion-reduce:animate-none sm:gap-5 sm:p-4"
            >
              <div className="aspect-video w-28 shrink-0 bg-bg sm:w-44" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 w-2/3 bg-line" />
                <div className="h-10 w-32 bg-line" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
      </div>
    );
  }

  if (state.k === "gate") {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <ShoppingCartSimple className="mx-auto h-8 w-8 text-accent" weight="bold" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">Sign in to see your cart</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Your cart rides with your account — sign in and it&apos;s all here.
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
        <h2 className="font-display text-3xl uppercase">We couldn&apos;t load your cart</h2>
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
  const totalCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <CoinArt className="mx-auto h-16 w-16" />
        <h2 className="mt-4 font-display text-3xl uppercase">Your cart is empty</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Find a title worth the arena — it&apos;ll wait for you right here.
        </p>
        <Link
          href="/games"
          className="mt-6 inline-flex h-11 items-center bg-accent px-6 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
        >
          Browse the store
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      <div>
        {flash && (
          <p role="status" className="mb-4 border-l-2 border-accent/60 bg-surface px-4 py-2.5 font-mono text-xs text-muted">
            {flash}
          </p>
        )}

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
                  <div className="flex flex-wrap items-start justify-between gap-x-4">
                    <Link
                      href={`/games/${item.gameId}`}
                      className="font-display text-xl leading-tight uppercase text-heading transition-colors duration-200 hover:text-accent sm:text-2xl"
                    >
                      {item.gameName}
                    </Link>
                    <p className="font-mono text-lg font-bold tabular-nums text-accent sm:text-xl">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {formatPrice(item.price)} each
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    {/* quantity stepper — BuyBox grammar, cart-scoped */}
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        onClick={() => void setQty(item, item.quantity - 1)}
                        disabled={busy !== null || item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.gameName}`}
                        className="flex h-9 w-9 items-center justify-center text-muted transition-colors duration-200 hover:text-accent disabled:opacity-40 disabled:hover:text-muted"
                      >
                        <Minus className="h-4 w-4" weight="bold" aria-hidden />
                      </button>
                      <span
                        aria-live="polite"
                        className="w-9 text-center font-mono text-sm font-bold tabular-nums text-heading"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => void setQty(item, item.quantity + 1)}
                        disabled={busy !== null || item.quantity >= 99}
                        aria-label={`Increase quantity of ${item.gameName}`}
                        className="flex h-9 w-9 items-center justify-center text-muted transition-colors duration-200 hover:text-accent disabled:opacity-40 disabled:hover:text-muted"
                      >
                        <Plus className="h-4 w-4" weight="bold" aria-hidden />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void remove(item)}
                      className="inline-flex h-9 items-center gap-2 border border-line px-3 font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      {/* rail — GLB panel (DualShock haul) over the summary, sticky beside the list */}
      <aside className="h-max lg:sticky lg:top-24">
        <div className="relative h-44 overflow-hidden border border-line bg-surface sm:h-56 lg:h-64">
          <div
            aria-hidden="true"
            className="grid-floor pointer-events-none absolute inset-0 opacity-60"
          />
          <div
            aria-hidden="true"
            className="dither-glow pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-70"
          />
          <GlbPanel src="/models/dualshock4.glb" fitSize={0.16} className="absolute inset-0" />
          <p className="absolute bottom-4 left-5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            The haul
          </p>
          {/* CC BY 4.0 requires crediting the model author */}
          <a
            href="https://sketchfab.com/3d-models/b0cbb5caba6b4a6bb49c44cd27ff1aff"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-4 bottom-4 font-mono text-[10px] tracking-[0.1em] text-muted uppercase transition-colors duration-200 hover:text-accent"
          >
            Model: JeppeHove-Nyborg · CC BY 4.0
          </a>
        </div>

        <div className="mt-4 border border-line bg-surface p-6">
          <h2 className="font-display text-2xl uppercase">Summary</h2>
          <dl className="mt-4 space-y-3 border-b border-line pb-4 font-mono text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="tracking-[0.12em] text-muted uppercase">Items</dt>
              <dd className="tabular-nums text-heading">{totalCount}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="tracking-[0.12em] text-muted uppercase">Subtotal</dt>
              <dd className="text-xl font-bold tabular-nums text-accent">{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-accent font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Proceed to checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
