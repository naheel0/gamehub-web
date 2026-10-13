import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order confirmation — GameHub",
  description: "Payment status for your GameHub order.",
};

type Search = Promise<{
  razorpay_payment_link_id?: string;
  razorpay_payment_link_status?: string;
  razorpay_payment_id?: string;
  reference_id?: string;
}>;

/**
 * Razorpay's return lands here with the callback params; the island decides
 * paid / failed / resume from them (plus the `gh_pending` draft). The shell
 * prerenders while the searchParams read streams behind a skeleton —
 * server-read params keep useSearchParams' Suspense requirement out.
 */
export default function OrderConfirmationPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Navbar />
      <main id="top" className="mx-auto w-full max-w-4xl px-5 pt-24 pb-20 sm:px-8">
        <Suspense
          fallback={
            <div
              aria-busy="true"
              className="border border-line bg-surface px-6 py-20 text-center motion-reduce:animate-none"
            >
              <p className="font-display text-3xl uppercase">Checking your payment…</p>
              <p className="mt-2 font-mono text-xs text-muted">Hold tight — this takes a moment.</p>
            </div>
          }
        >
          <ConfirmationBody searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

async function ConfirmationBody({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  return (
    <OrderConfirmation
      linkId={sp.razorpay_payment_link_id ?? null}
      status={sp.razorpay_payment_link_status ?? null}
      paymentId={sp.razorpay_payment_id ?? null}
      referenceId={sp.reference_id ?? null}
    />
  );
}
