"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, CreditCard, MapPin, Plus, ShoppingCartSimple, Star } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import { PENDING_KEY, storeCall, type StoreResult } from "@/lib/store";
import type { Address, CartItem, Game, Order } from "@/lib/types";

/**
 * Checkout island (cart + buy-now): delivery-address picker (inline add when
 * the book is empty), an order summary with the store's 10% tax, and the pay
 * hand-off — place the order, mint the Razorpay link, stash the `gh_pending`
 * draft, then full-page redirect to shortUrl. A failed link mint keeps the
 * placed order so retry never double-orders.
 */
type Props = {
  mode: "cart" | "buy";
  buyId: number | null;
  buyGame: Game | null;
  buyQty: number;
};

type State =
  | { k: "loading" }
  | { k: "gate" }
  | { k: "error"; message: string }
  | { k: "empty" }
  | { k: "ready"; items: CartItem[]; addresses: Address[]; selectedId: string | null };

type PaymentLink = {
  razorpayPaymentLinkId: string;
  shortUrl: string;
  purchaseId: number;
  orderId: string;
  amount: number;
  currency: string;
};

type Draft = {
  purchaseId: number;
  orderId: string;
  total: number;
  linkId: string;
  shortUrl: string;
};

type Field = "fullName" | "addressLine1" | "addressLine2" | "city" | "state" | "zipCode" | "country" | "phone";
const EMPTY: Record<Field, string> = {
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phone: "",
};
const inputCls =
  "h-12 w-full border border-line bg-bg px-4 font-mono text-sm tracking-[0.04em] text-heading transition-shadow duration-200 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none";

const pickDefault = (addresses: Address[]) =>
  addresses.find((a) => a.isDefault)?.addressId ?? addresses[0]?.addressId ?? null;

/** HUD stage chip: done → check, active → accent square, pending → dim square. */
function Stage({ state, label }: { state: "done" | "active" | "pending"; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${state === "pending" ? "text-muted" : "text-accent"}`}>
      {state === "done" ? (
        <CheckCircle className="h-3.5 w-3.5" weight="fill" aria-hidden />
      ) : (
        <span aria-hidden className={`h-2 w-2 ${state === "active" ? "bg-accent" : "bg-line"}`} />
      )}
      {label}
      <span className="sr-only">
        {state === "done" ? " — done" : state === "active" ? " — current stage" : " — next"}
      </span>
    </li>
  );
}

export default function CheckoutClient({ mode, buyId, buyGame, buyQty }: Props) {
  const [state, setState] = useState<State>({ k: "loading" });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<Field, string>>(EMPTY);
  const [formErrs, setFormErrs] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);
  // order already placed when a link mint fails — retry mints, never re-orders
  const [heldOrder, setHeldOrder] = useState<Order | null>(null);

  const load = async () => {
    const [cart, addrs] = await Promise.all([
      mode === "cart" ? storeCall<CartItem[]>("GET", "/api/cart") : Promise.resolve<StoreResult<CartItem[]> | null>(null),
      storeCall<Address[]>("GET", "/api/addresses"),
    ]);
    if (!addrs.ok) {
      setState(addrs.status === 401 ? { k: "gate" } : { k: "error", message: addrs.message });
      return;
    }
    if (cart && !cart.ok) {
      setState(cart.status === 401 ? { k: "gate" } : { k: "error", message: cart.message });
      return;
    }
    const addresses = Array.isArray(addrs.data) ? addrs.data : [];
    if (mode === "buy") {
      if (!buyGame) {
        setState({
          k: "error",
          message: "We couldn't load that title — head back to the store and try again.",
        });
        return;
      }
      setState({
        k: "ready",
        items: [
          {
            gameId: buyGame.id,
            gameName: buyGame.name,
            image: buyGame.imageUrls[0] ?? "",
            price: buyGame.price,
            quantity: buyQty,
          },
        ],
        addresses,
        selectedId: pickDefault(addresses),
      });
      return;
    }
    const items = Array.isArray(cart?.data) ? cart.data : [];
    if (items.length === 0) {
      setState({ k: "empty" });
      return;
    }
    setState({ k: "ready", items, addresses, selectedId: pickDefault(addresses) });
  };

  useEffect(() => {
    // deferred so the first loading paint commits before any setState
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
    // run once on mount: props are fixed for this checkout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setState({ k: "loading" });
    void load();
  };

  // ---- inline add (shown when the book is empty; profile manages the rest) ----
  const set = (f: Field, v: string) => {
    setForm((prev) => ({ ...prev, [f]: v }));
    if (formErrs[f]) setFormErrs((e) => ({ ...e, [f]: undefined }));
  };

  const submitAddress = async () => {
    if (addBusy || state.k !== "ready") return;
    const e: Partial<Record<Field, string>> = {};
    if (!form.fullName.trim()) e.fullName = "Enter the recipient's name.";
    if (!form.addressLine1.trim()) e.addressLine1 = "Enter a street address.";
    if (!form.city.trim()) e.city = "Enter a city.";
    if (!form.state.trim()) e.state = "Enter a state.";
    if (!form.zipCode.trim()) e.zipCode = "Enter a ZIP code.";
    if (!form.country.trim()) e.country = "Enter a country.";
    if (!form.phone.trim()) e.phone = "Enter a phone number.";
    setFormErrs(e);
    if (Object.keys(e).length > 0) return;

    setAddBusy(true);
    setFormError(null);
    const r = await storeCall<Address>("POST", "/api/addresses", {
      fullName: form.fullName.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode.trim(),
      country: form.country.trim(),
      phone: form.phone.trim(),
      isDefault: state.addresses.length === 0,
    });
    setAddBusy(false);
    if (!r.ok) {
      if (r.status === 401) setState({ k: "gate" });
      else setFormError(r.message);
      return;
    }
    const created = r.data;
    setState((s) =>
      s.k === "ready"
        ? {
            ...s,
            addresses: [...s.addresses, created],
            selectedId: created.addressId,
          }
        : s,
    );
    setForm(EMPTY);
    setShowAdd(false);
  };

  // ---- pay: order → link → draft → redirect ----
  const startPayment = async () => {
    if (paying || state.k !== "ready" || !state.selectedId) return;
    setPaying(true);
    setPayErr(null);
    const addressId = state.selectedId;

    let order = heldOrder;
    if (!order) {
      const r =
        mode === "buy"
          ? await storeCall<Order>("POST", "/api/orders/buy-now", {
              gameId: buyId,
              quantity: buyQty,
              addressId,
            })
          : await storeCall<Order>("POST", "/api/orders", {
              addressId,
              paymentMethod: "Razorpay",
            });
      if (!r.ok) {
        setPaying(false);
        if (r.status === 401) setState({ k: "gate" });
        else setPayErr(r.message);
        return;
      }
      order = r.data;
      setHeldOrder(order);
    }

    const link = await storeCall<PaymentLink>("POST", `/api/payments/create-link/${order.purchaseId}`);
    if (!link.ok) {
      setPaying(false);
      setPayErr(
        `${link.message} Your order is placed — retry to open the payment page; nothing is charged twice.`,
      );
      return;
    }

    const draft: Draft = {
      purchaseId: order.purchaseId,
      orderId: order.orderId,
      total: Number(order.total),
      linkId: link.data.razorpayPaymentLinkId,
      shortUrl: link.data.shortUrl,
    };
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(draft));
    } catch {
      // storage blocked: confirmation still works off the callback params
    }
    window.location.href = link.data.shortUrl; // busy stays on — the redirect is the spinner
  };

  // ---- render ----
  if (state.k === "loading") {
    return (
      <div aria-busy="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="grid gap-3 sm:gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
          ))}
        </div>
        <div className="h-72 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
      </div>
    );
  }

  if (state.k === "gate") {
    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <CreditCard className="mx-auto h-8 w-8 text-accent" weight="bold" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">Sign in to check out</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Your addresses and order history ride with your account — sign in and you&apos;re right
          back here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
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
        <h2 className="font-display text-3xl uppercase">We couldn&apos;t load checkout</h2>
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

  if (state.k === "empty") {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <ShoppingCartSimple className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">Your cart is empty</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Nothing to check out yet — find a title worth the arena first.
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

  const { items, addresses, selectedId } = state;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 10) / 100; // store tax is 10%
  const total = subtotal + tax;
  const adding = showAdd || addresses.length === 0;
  const soldOut = mode === "buy" && buyGame !== null && !buyGame.inStock;
  const err = (f: Field) =>
    formErrs[f] ? <p className="mt-1.5 font-mono text-[11px] text-accent">{formErrs[f]}</p> : null;

  const stage2 = paying ? "done" : "active";
  const stage3 = paying ? "active" : "pending";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      {/* left — stage HUD, address, pay */}
      <div>
        <ol
          aria-label="Checkout progress"
          className="deal-in flex flex-wrap items-center gap-x-3 gap-y-2 border border-line bg-surface px-4 py-3 font-mono text-[11px] tracking-[0.14em] uppercase"
        >
          <Stage state="done" label="Cart" />
          <span aria-hidden className="h-px w-6 bg-line sm:w-10" />
          <Stage state={stage2} label="Delivery & pay" />
          <span aria-hidden className="h-px w-6 bg-line sm:w-10" />
          <Stage state={stage3} label="Razorpay" />
        </ol>

        <section className="deal-in mt-4 border border-line bg-surface p-6" style={{ animationDelay: "45ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase">Delivery address</h2>
            {addresses.length > 0 && !adding && (
              <Link
                href="/profile"
                className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
              >
                Manage addresses →
              </Link>
            )}
          </div>

          {adding ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submitAddress();
              }}
              className="mt-5"
            >
              <p className="font-mono text-xs text-muted">
                Add where your wins get delivered — it&apos;s one form and you&apos;re set.
              </p>
              {formError && (
                <p role="alert" className="mt-4 border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text">
                  {formError}
                </p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="co-name" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    Full name
                  </label>
                  <input
                    id="co-name"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    aria-invalid={!!formErrs.fullName}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("fullName")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-line1" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    Street address
                  </label>
                  <input
                    id="co-line1"
                    autoComplete="address-line1"
                    value={form.addressLine1}
                    onChange={(e) => set("addressLine1", e.target.value)}
                    aria-invalid={!!formErrs.addressLine1}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("addressLine1")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-line2" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    Apartment, suite, etc. <span className="normal-case">(optional)</span>
                  </label>
                  <input
                    id="co-line2"
                    autoComplete="address-line2"
                    value={form.addressLine2}
                    onChange={(e) => set("addressLine2", e.target.value)}
                    className={`mt-2 ${inputCls}`}
                  />
                </div>
                <div>
                  <label htmlFor="co-city" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    City
                  </label>
                  <input
                    id="co-city"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    aria-invalid={!!formErrs.city}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("city")}
                </div>
                <div>
                  <label htmlFor="co-state" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    State
                  </label>
                  <input
                    id="co-state"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    aria-invalid={!!formErrs.state}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("state")}
                </div>
                <div>
                  <label htmlFor="co-zip" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    ZIP code
                  </label>
                  <input
                    id="co-zip"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={form.zipCode}
                    onChange={(e) => set("zipCode", e.target.value)}
                    aria-invalid={!!formErrs.zipCode}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("zipCode")}
                </div>
                <div>
                  <label htmlFor="co-country" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    Country
                  </label>
                  <input
                    id="co-country"
                    autoComplete="country-name"
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    aria-invalid={!!formErrs.country}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("country")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-phone" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                    Phone
                  </label>
                  <input
                    id="co-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    aria-invalid={!!formErrs.phone}
                    className={`mt-2 ${inputCls}`}
                  />
                  {err("phone")}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={addBusy}
                  className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {addBusy ? "Saving…" : "Save address"}
                </button>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    disabled={addBusy}
                    className="inline-flex h-12 items-center border border-line px-6 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <fieldset className="mt-4">
              <legend className="sr-only">Choose a delivery address</legend>
              <ul className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a, i) => {
                  const sel = selectedId === a.addressId;
                  return (
                    <li key={a.addressId} className="deal-in" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                      <label
                        className={`relative flex h-full cursor-pointer flex-col border p-4 transition-colors duration-200 focus-within:shadow-[0_0_0_1px_var(--color-accent)] ${
                          sel ? "border-accent bg-accent/5" : "border-line hover:border-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          className="sr-only"
                          checked={sel}
                          onChange={() => setState((s) => (s.k === "ready" ? { ...s, selectedId: a.addressId } : s))}
                        />
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-display text-lg leading-tight uppercase text-heading">
                            {a.fullName}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {a.isDefault && (
                              <Star className="h-3.5 w-3.5 text-accent" weight="fill" aria-label="Default address" />
                            )}
                            {sel && <CheckCircle className="h-4 w-4 text-accent" weight="fill" aria-hidden />}
                          </span>
                        </span>
                        <address className="mt-2 not-italic text-sm leading-relaxed text-text">
                          {a.addressLine1}
                          {a.addressLine2 ? <>, {a.addressLine2}</> : null}
                          <br />
                          {a.city}, {a.state} {a.zipCode}
                          <br />
                          <span className="font-mono text-xs text-muted">{a.phone}</span>
                        </address>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {addresses.length > 0 && !adding && (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY);
                setFormErrs({});
                setFormError(null);
                setShowAdd(true);
              }}
              className="mt-4 inline-flex h-9 items-center gap-1.5 border border-line px-3 font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" aria-hidden />
              Add another address
            </button>
          )}
        </section>

        {/* pay zone */}
        <section className="deal-in mt-4 border border-line bg-surface p-6" style={{ animationDelay: "90ms" }}>
          <h2 className="font-display text-2xl uppercase">Pay</h2>

          {soldOut ? (
            <p role="status" className="mt-3 border-l-2 border-accent/60 bg-bg px-4 py-3 font-mono text-xs leading-relaxed text-muted">
              This title is out of stock right now, so it can&apos;t be ordered.{" "}
              <Link href="/games" className="text-heading underline decoration-accent underline-offset-4 hover:text-accent">
                Back to the store
              </Link>
              .
            </p>
          ) : null}

          {payErr && (
            <p role="alert" className="mt-3 border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs leading-relaxed text-text">
              {payErr}
            </p>
          )}

          <button
            type="button"
            onClick={() => void startPayment()}
            disabled={paying || !selectedId || soldOut}
            className="coin-pay relative mt-4 flex h-14 w-full items-center justify-center overflow-hidden bg-accent font-display text-xl tracking-wide text-bg uppercase transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:hover:translate-y-0"
          >
            <span
              aria-hidden="true"
              className="coin-scan pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            <span className="relative">
              {paying
                ? "Opening Razorpay…"
                : heldOrder
                  ? "Retry payment"
                  : `Pay ${formatPrice(total)}`}
            </span>
          </button>

          <p className="mt-3 text-center font-mono text-[11px] leading-relaxed text-muted">
            {selectedId && !soldOut
              ? "You'll continue on Razorpay's payment page, then land back here."
              : "Pick a delivery address to unlock payment."}
          </p>
          <p className="mt-2 text-center font-mono text-[11px] text-muted">
            Payment runs through{" "}
            <Link
              href="/payments"
              className="text-heading underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent"
            >
              Razorpay
            </Link>{" "}
            ·{" "}
            <Link
              href="/refunds"
              className="text-heading underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent"
            >
              refund policy
            </Link>
          </p>
        </section>
      </div>

      {/* right — summary rail */}
      <aside className="h-max lg:sticky lg:top-24">
        <div className="deal-in border border-line bg-surface p-6" style={{ animationDelay: "135ms" }}>
          <h2 className="font-display text-2xl uppercase">Summary</h2>
          <ul className="mt-4 grid gap-3 border-b border-line pb-4">
            {items.map((item) => (
              <li key={item.gameId} className="flex items-center gap-3">
                <span className="relative aspect-video w-16 shrink-0 overflow-hidden border border-line bg-bg">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid-floor block h-full w-full" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base leading-tight uppercase text-heading">
                    {item.gameName}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {item.quantity} × {formatPrice(item.price)}
                  </span>
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-heading">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-3 font-mono text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="tracking-[0.12em] text-muted uppercase">Subtotal</dt>
              <dd className="tabular-nums text-heading">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="tracking-[0.12em] text-muted uppercase">Tax (10%)</dt>
              <dd className="tabular-nums text-heading">{formatPrice(tax)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="tracking-[0.12em] text-muted uppercase">Total</dt>
              <dd className="text-2xl font-bold tabular-nums text-accent">{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>

        <div className="deal-in mt-4 flex items-start gap-3 border border-line bg-surface/60 p-4" style={{ animationDelay: "180ms" }}>
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" weight="bold" aria-hidden />
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {selectedId
              ? `Delivering to ${addresses.find((a) => a.addressId === selectedId)?.fullName ?? "your address"}.`
              : "No address selected yet."}
          </p>
        </div>
      </aside>
    </div>
  );
}
