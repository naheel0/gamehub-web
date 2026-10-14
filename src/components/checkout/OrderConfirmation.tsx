"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "@/components/ui/icons";
import { CoinArt, MedalArt } from "@/components/ui/EmptyArt";
import { formatPrice } from "@/lib/format";
import { announceCounts, PENDING_KEY, storeCall } from "@/lib/store";
import type { Order } from "@/lib/types";

/**
 * Razorpay return island: paid → confirm-link (register the payment) →
 * achievement card with the order detail; failed/cancelled → restore the
 * cart and say so honestly; no params → resume the stashed `gh_pending`
 * link or point at the store. The draft is read and cleared synchronously
 * before any await, and a mount guard runs the branch exactly once —
 * double-effects can neither confirm nor restore twice.
 */
type Props = {
  linkId: string | null;
  status: string | null;
  paymentId: string | null;
  referenceId: string | null;
};

type Draft = {
  purchaseId: number;
  orderId: string;
  total: number;
  linkId: string;
  shortUrl: string;
};

type Phase = "working" | "paid" | "confirm-error" | "failed" | "restore-error" | "resume" | "nothing";

type Attempt = { purchaseId: number; linkId: string; paymentId: string };

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    if (typeof d.purchaseId !== "number" || typeof d.shortUrl !== "string") return null;
    return d as Draft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // storage blocked — nothing to clear
  }
}

export default function OrderConfirmation({ linkId, status, paymentId, referenceId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("working");
  const [note, setNote] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ orderId: string; items: Order["items"]; total: number } | null>(null);
  const [paidTotal, setPaidTotal] = useState<number | null>(null);
  const [resume, setResume] = useState<Draft | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const started = useRef(false);

  const confirm = async (a: Attempt | null) => {
    if (!a) {
      setNote("This callback didn't carry the payment reference we need.");
      setPhase("confirm-error");
      return;
    }
    setPhase("working");
    const r = await storeCall<{ success?: boolean; orderId?: string; message?: string }>(
      "POST",
      "/api/payments/confirm-link",
      {
        purchaseId: a.purchaseId,
        razorpayPaymentLinkId: a.linkId,
        razorpayPaymentId: a.paymentId,
      },
    );
    if (!r.ok || r.data?.success === false) {
      setNote(r.ok ? (r.data.message ?? null) : r.message);
      setPhase("confirm-error");
      return;
    }
    if (r.data?.orderId) {
      const o = await storeCall<Order>("GET", `/api/orders/${r.data.orderId}`);
      if (o.ok && o.data) {
        setDetail({
          orderId: o.data.orderId,
          items: o.data.items ?? [],
          total: Number(o.data.total),
        });
      }
    }
    announceCounts(); // the order may have emptied the cart — refresh badges
    setPhase("paid");
  };

  const restore = async (purchaseId: number) => {
    setPhase("working");
    const r = await storeCall<{ restored: boolean }>("POST", `/api/payments/restore/${purchaseId}`);
    announceCounts(); // cart changed either way
    if (r.ok) setPhase("failed");
    else {
      setNote(r.message);
      setPhase("restore-error");
    }
  };

  useEffect(() => {
    // deferred so the first "working" paint commits before any setState;
    // clearTimeout on unmount makes the once-guard race-proof
    const t = window.setTimeout(() => {
      if (started.current) return;
      started.current = true;

      const draft = readDraft();
      const hasCallback = !!(status || paymentId || referenceId);
      if (!hasCallback) {
        setResume(draft);
        setPhase(draft ? "resume" : "nothing");
        return;
      }

      const fromRef = referenceId ? /^purchase-(\d+)/.exec(referenceId)?.[1] : undefined;
      const purchaseId = fromRef ? Number(fromRef) : draft?.purchaseId ?? null;
      const effLinkId = linkId ?? draft?.linkId ?? "";
      const total = draft?.total ?? null;
      clearDraft(); // synchronous, before any await — race guard

      if (!purchaseId) {
        setNote("This return didn't carry an order reference, so there's nothing to confirm.");
        setPhase("nothing");
        return;
      }

      const a: Attempt = { purchaseId, linkId: effLinkId, paymentId: paymentId ?? "" };
      setAttempt(a);
      setPaidTotal(total);

      const paid = status === "paid" || (!!paymentId && !!effLinkId && !status);
      if (paid && paymentId && effLinkId) void confirm(a);
      else void restore(purchaseId);
    }, 0);
    return () => window.clearTimeout(t);
    // run exactly once per mount; callback params are fixed for this visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panel =
    "deal-in relative overflow-hidden border border-line bg-surface px-6 py-12 text-center sm:px-10 sm:py-16";
  const kicker = "font-mono text-xs tracking-[0.18em] text-accent uppercase";

  if (phase === "working") {
    return (
      <div className="border border-line bg-surface px-6 py-20 text-center">
        <CoinArt className="mx-auto h-12 w-12" />
        <p className="mt-5 font-display text-3xl uppercase">Checking your payment…</p>
        <p className="mt-2 font-mono text-xs text-muted">Hold tight — this takes a moment.</p>
      </div>
    );
  }

  if (phase === "paid") {
    return (
      <section className={`${panel} ring-1 ring-accent/60`}>
        <div aria-hidden="true" className="grid-floor pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden="true"
          className="dither-glow pointer-events-none absolute top-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 opacity-70"
        />
        {/* one-shot flash + rays — zero opacity at rest so reduced-motion stays clean */}
        <div aria-hidden="true" className="win-flash pointer-events-none absolute inset-0 bg-accent opacity-0" />
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="win-ray pointer-events-none absolute top-16 left-1/2 h-24 w-0.5 origin-top bg-accent/70 opacity-0"
            style={{ "--ray": `${i * 45}deg`, animationDelay: `${i * 55}ms` } as CSSProperties}
          />
        ))}

        <div className="relative">
          <p className={kicker}>Achievement unlocked</p>
          <MedalArt className="badge-pop mx-auto mt-6 h-16 w-16" />
          <h1 className="mt-5 font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-[0.9] uppercase">
            Payment <span className="text-accent">confirmed</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-text">
            Your order is locked in — it&apos;s on its way to the delivery address you picked.
          </p>

          {(detail?.items.length || paidTotal !== null) && (
            <div className="mx-auto mt-7 max-w-md border border-line bg-bg/60 p-5 text-left">
              {detail && detail.items.length > 0 && (
                <ul className="grid gap-2 border-b border-line pb-3">
                  {detail.items.map((it) => (
                    <li key={it.gameId} className="flex items-baseline justify-between gap-4 font-mono text-xs">
                      <span className="truncate text-heading">
                        {it.gameName} <span className="text-muted">× {it.quantity}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted">{formatPrice(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <span className="tracking-[0.12em] text-muted uppercase">Total paid</span>
                <span className="font-mono text-xl font-bold tabular-nums text-accent">
                  {formatPrice(detail?.total ?? paidTotal ?? 0)}
                </span>
              </div>
              {attempt && (
                <p className="mt-3 font-mono text-[11px] break-all text-muted">
                  Order ref · {attempt.purchaseId}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/profile"
              className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
            >
              View your orders
            </Link>
            <Link
              href="/games"
              className="inline-flex h-12 items-center border border-line px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              Keep browsing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (phase === "confirm-error") {
    return (
      <section className={panel}>
        <p className={kicker}>Registration hiccup</p>
        <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.9] uppercase">
          One more <span className="text-accent">step</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[54ch] text-text">
          Razorpay marked this payment as done, but registering it on GameHub just failed. Your
          payment isn&apos;t lost — retry below, or check your orders page in a moment.
        </p>
        {note && (
          <p role="alert" className="mx-auto mt-4 max-w-[54ch] border-l-2 border-accent bg-bg px-4 py-3 text-left font-mono text-xs leading-relaxed text-muted">
            {note}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void confirm(attempt)}
            className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Retry confirmation
          </button>
          <Link
            href="/profile"
            className="inline-flex h-12 items-center border border-line px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Check your orders
          </Link>
        </div>
      </section>
    );
  }

  if (phase === "failed") {
    return (
      <section className={panel}>
        <div aria-hidden="true" className="grid-floor pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative">
          <p className={kicker}>Payment not completed</p>
          <X className="mx-auto mt-6 h-14 w-14 text-muted" weight="bold" aria-hidden />
          <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.9] uppercase">
            Nothing was <span className="text-accent">charged</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-text">
            The payment didn&apos;t go through — your cart&apos;s been restored with everything
            still in it. Pick up whenever you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/cart"
              className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
            >
              Back to your cart
            </Link>
            <Link
              href="/games"
              className="inline-flex h-12 items-center border border-line px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              Keep browsing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (phase === "restore-error") {
    return (
      <section className={panel}>
        <p className={kicker}>Payment not completed</p>
        <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.9] uppercase">
          Check your <span className="text-accent">cart</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[54ch] text-text">
          The payment didn&apos;t go through, and we couldn&apos;t restore your cart automatically
          from here. Open your cart — if anything&apos;s missing, it&apos;s still on your account.
        </p>
        {note && (
          <p role="alert" className="mx-auto mt-4 max-w-[54ch] border-l-2 border-accent bg-bg px-4 py-3 text-left font-mono text-xs leading-relaxed text-muted">
            {note}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/cart"
            className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Open your cart
          </Link>
        </div>
      </section>
    );
  }

  if (phase === "resume" && resume) {
    return (
      <section className={panel}>
        <div aria-hidden="true" className="grid-floor pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative">
          <p className={kicker}>Continue checkout</p>
          <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.9] uppercase">
            Pick up where you <span className="text-accent">left off</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-text">
            Your payment link is still open
            {resume.total ? <> for {formatPrice(resume.total)}</> : null} — finish it whenever
            you&apos;re ready, or start over from your cart.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = resume.shortUrl;
              }}
              className="coin-pay relative inline-flex h-12 items-center overflow-hidden bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
            >
              <span
                aria-hidden="true"
                className="coin-scan pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <span className="relative">Resume payment</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                router.push("/cart");
              }}
              className="inline-flex h-12 items-center border border-line px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              Start over
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={panel}>
      <p className={kicker}>Nothing pending</p>
      <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.9] uppercase">
        No payment <span className="text-accent">waiting</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[52ch] text-text">
        {note ?? "There's no order or payment awaiting confirmation right now."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/games"
          className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
        >
          Browse the store
        </Link>
        <Link
          href="/cart"
          className="inline-flex h-12 items-center border border-line px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          Your cart
        </Link>
      </div>
    </section>
  );
}
