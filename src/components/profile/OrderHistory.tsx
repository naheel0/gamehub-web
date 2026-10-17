"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import { storeCall, type StoreResult } from "@/lib/store";
import type { Order } from "@/lib/types";

/**
 * Order history: one card per order — id, date, status chip (text always,
 * colour never alone), item lines linked back to their games, the money
 * breakdown the backend computed, and the shipping snapshot as placed.
 * History rows already carry full detail, so there's no drill-down. An
 * unpaid Razorpay order rides the same payment-link flow checkout uses.
 */
type State =
  | { k: "loading" }
  | { k: "error"; message: string }
  | { k: "signin" }
  | { k: "ready"; orders: Order[] };

const statusChip = (status: string) =>
  status === "Cancelled"
    ? "border-line text-muted"
    : "border-accent/60 text-accent";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function OrderHistory() {
  const [state, setState] = useState<State>({ k: "loading" });
  const [paying, setPaying] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const read = (r: StoreResult<Order[]>) => {
    // an expired session gets the honest sign-in gate, never a dead-end retry
    if (!r.ok && r.status === 401) {
      setState({ k: "signin" });
      return;
    }
    if (r.ok) setState({ k: "ready", orders: Array.isArray(r.data) ? r.data : [] });
    else setState({ k: "error", message: r.message });
  };

  useEffect(() => {
    let live = true;
    storeCall<Order[]>("GET", "/api/orders").then((r) => {
      if (live) read(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const retry = () => {
    setState({ k: "loading" });
    storeCall<Order[]>("GET", "/api/orders").then(read);
  };

  const pay = async (order: Order) => {
    if (paying !== null) return;
    setPaying(order.purchaseId);
    setPayError(null);
    const r = await storeCall<{ shortUrl: string }>(
      "POST",
      `/api/payments/create-link/${order.purchaseId}`,
    );
    setPaying(null);
    if (!r.ok) {
      setPayError(r.message);
      return;
    }
    if (r.data?.shortUrl) window.location.assign(r.data.shortUrl);
    else setPayError("The payment link didn't open — try again.");
  };

  if (state.k === "loading") {
    return (
      <div aria-busy="true" className="grid gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-52 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (state.k === "signin") {
    return (
      <div className="border border-line bg-surface px-6 py-10 text-center">
        <Package className="mx-auto h-8 w-8 text-muted" weight="bold" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">Sign in to see your orders</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Your session timed out. Sign in and you&apos;ll land straight back here.
        </p>
        <Link
          href="/login?next=/profile"
          className="mt-6 inline-flex h-11 items-center bg-accent px-6 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (state.k === "error") {
    return (
      <div className="border border-line bg-surface px-6 py-10 text-center">
        <h2 className="font-display text-3xl uppercase">We couldn&apos;t load your orders</h2>
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

  const { orders } = state;

  if (orders.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <Package className="mx-auto h-8 w-8 text-muted" weight="bold" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">No orders yet</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Your first win shows up here — receipt, status, and the lot.
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
    <ul className="grid gap-4">
      {orders.map((order, i) => (
        <li key={order.orderId} className="deal-in" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
          <article className="border border-line bg-surface p-4 transition-colors duration-200 hover:border-accent/50 sm:p-6">
            <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-4">
              <h3 className="font-display text-2xl leading-none uppercase text-heading">
                Order{" "}
                <span className="break-all font-mono text-xs font-bold tracking-[0.04em] text-accent sm:text-sm">
                  {/* full id: support asks for the whole thing, a stub fails */}
                  {order.orderId.toUpperCase()}
                </span>
              </h3>
              <time
                dateTime={order.orderDate}
                className="font-mono text-xs tracking-[0.1em] text-muted uppercase"
              >
                {formatDate(order.orderDate)}
              </time>
              <span
                className={`border px-2.5 py-0.5 font-mono text-[11px] tracking-[0.14em] uppercase ${statusChip(order.status)}`}
              >
                {order.status}
              </span>
              <p className="ml-auto text-lg font-bold tabular-nums text-accent">
                {formatPrice(order.total)}
              </p>
              {order.status === "Pending" && (
                <button
                  type="button"
                  onClick={() => void pay(order)}
                  disabled={paying === order.purchaseId}
                  className="inline-flex h-10 items-center bg-accent px-5 font-mono text-xs tracking-[0.14em] text-bg uppercase transition duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {paying === order.purchaseId ? "Opening payment…" : "Pay now"}
                </button>
              )}
            </header>

            {payError && (
              <p key={payError} role="alert" className="mt-3 border-l-2 border-accent bg-bg px-4 py-2.5 font-mono text-xs text-text">
                {payError}
              </p>
            )}

            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.gameId} className="flex items-baseline justify-between gap-4 py-3">
                  <Link
                    href={`/games/${item.gameId}`}
                    className="font-display text-lg leading-tight uppercase text-heading transition-colors duration-200 hover:text-accent"
                  >
                    {item.gameName}
                    <span className="ml-2 font-mono text-xs font-normal text-muted">
                      × {item.quantity}
                    </span>
                  </Link>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-text">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="grid gap-6 border-t border-line pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                  Shipped to
                </p>
                <address className="mt-2 not-italic text-sm leading-relaxed text-text">
                  {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : null}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                </address>
                <p className="mt-2 font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                  Payment method · {order.paymentMethod}
                </p>
              </div>

              <dl className="min-w-48 space-y-2 self-start font-mono text-sm">
                <div className="flex justify-between gap-6">
                  <dt className="tracking-[0.1em] text-muted uppercase">Subtotal</dt>
                  <dd className="tabular-nums text-text">{formatPrice(order.subTotal)}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="tracking-[0.1em] text-muted uppercase">Tax</dt>
                  <dd className="tabular-nums text-text">{formatPrice(order.tax)}</dd>
                </div>
                <div className="flex justify-between gap-6 border-t border-line pt-2">
                  <dt className="tracking-[0.1em] text-heading uppercase">Total</dt>
                  <dd className="font-bold tabular-nums text-accent">{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
