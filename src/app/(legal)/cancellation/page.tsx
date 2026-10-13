import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Cancellation policy — GameHub",
  description:
    "How to cancel a GameHub order: contact us before your purchase is delivered; once delivered, the refund policy applies instead.",
};

export default function CancellationPage() {
  return (
    <>
      <Kicker>Legal · Effective October 13, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Cancellation policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Orders can be cancelled — how, and until when, depends on where the order is.
      </p>

      <Section title="Before delivery">
        <p>
          Purchases are delivered to your account the moment payment is confirmed, so
          the cancellation window is small: contact us while the order is still
          undelivered. If the purchase has not been delivered, we cancel the order —
          and if payment was taken, it goes back to your original payment method.
        </p>
      </Section>

      <Section title="After delivery">
        <p>
          Once a purchase has been delivered to your account, it can no longer be
          cancelled. If it is faulty or never worked as described, the{" "}
          <Link href="/refunds" className={inlineLink}>
            refund policy
          </Link>{" "}
          applies instead — requests within 7 days of purchase.
        </p>
      </Section>

      <Section title="How to request a cancellation">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Find the order ID under Orders on your{" "}
            <Link href="/profile" className={inlineLink}>
              profile page
            </Link>
            .
          </li>
          <li>
            Email{" "}
            <a href="mailto:support@gamehub.com" className={inlineLink}>
              support@gamehub.com
            </a>{" "}
            with the order ID and that you want the order cancelled.
          </li>
          <li>We confirm the cancellation and process any refund due.</li>
        </ol>
      </Section>

      <Section title="Orders we cancel">
        <p>
          We may cancel an order ourselves — for example a pricing error, a listing
          issue or suspected fraud — and anything already paid is refunded to the
          original payment method. This is also covered by the{" "}
          <Link href="/terms" className={inlineLink}>
            terms of service
          </Link>
          .
        </p>
      </Section>

      <Section title="Questions">
        <ContactLine />
      </Section>
    </>
  );
}
