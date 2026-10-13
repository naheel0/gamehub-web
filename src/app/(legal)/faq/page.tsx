import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "FAQ — GameHub",
  description:
    "Straight answers to the common GameHub questions: accounts and sign-in codes, rupee pricing, Razorpay payments, delivery, cancellations and refunds.",
};

export default function FaqPage() {
  return (
    <>
      <Kicker>Help · GameHub</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Frequently asked questions</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        The questions we get most, answered straight — each one links to the full
        policy where it matters.
      </p>

      <Section title="What is GameHub?">
        <p>
          A digital store for games. Browse the catalogue by genre, rating and price —
          everything in Indian rupees — pay, and the purchase lands in your account.
          More on the{" "}
          <Link href="/about" className={inlineLink}>
            about page
          </Link>
          .
        </p>
      </Section>

      <Section title="How do I create an account?">
        <p>
          Sign up with your email — we send a one-time 6-digit code to verify the
          address is yours. Codes expire in 10 minutes, and the sign-in form can
          resend one.
        </p>
      </Section>

      <Section title="Which currency do you use?">
        <p>
          Indian rupees, end to end — the price on the store page is listed in ₹ with
          no currency conversion at checkout.
        </p>
      </Section>

      <Section title="How can I pay?">
        <p>
          Payments are processed by Razorpay. The methods available to you — for
          example cards, UPI and netbanking — are shown in its checkout. No
          cash-on-delivery: this is a digital store. Details in the{" "}
          <Link href="/payments" className={inlineLink}>
            payment policy
          </Link>
          .
        </p>
      </Section>

      <Section title="When am I charged?">
        <p>
          When you place the order. If the payment does not go through, no order is
          placed — your cart stays as it was and you can try again.
        </p>
      </Section>

      <Section title="When do I get my game?">
        <p>
          As soon as the payment is confirmed — the purchase appears in your order
          history on the{" "}
          <Link href="/profile" className={inlineLink}>
            profile page
          </Link>
          . Nothing physical ships, so there are no delivery charges. See{" "}
          <Link href="/shipping" className={inlineLink}>
            shipping &amp; delivery
          </Link>
          .
        </p>
      </Section>

      <Section title="Can I cancel an order?">
        <p>
          Yes, while it is still undelivered — contact us with the order ID. Once the
          purchase has been delivered, it moves to the refund path instead. Full
          detail in the{" "}
          <Link href="/cancellation" className={inlineLink}>
            cancellation policy
          </Link>
          .
        </p>
      </Section>

      <Section title="How do refunds work?">
        <p>
          If a purchase did not arrive or does not work as described, request a
          refund within 7 days — approved refunds go back through your original
          payment method. The{" "}
          <Link href="/refunds" className={inlineLink}>
            refund policy
          </Link>{" "}
          lists what qualifies.
        </p>
      </Section>

      <Section title="Where is my purchase?">
        <p>
          Everything you have bought is listed under Orders on your profile page. If
          something is missing there, it was not delivered — that is exactly what the{" "}
          <Link href="/refunds" className={inlineLink}>
            refund policy
          </Link>{" "}
          covers.
        </p>
      </Section>

      <Section title="Do you store my card details?">
        <p>
          No. Card numbers, UPI IDs and similar details are handled by Razorpay under
          its own terms — GameHub never collects or stores them. More in the{" "}
          <Link href="/privacy" className={inlineLink}>
            privacy policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Who owns the game artwork?">
        <p>
          Game titles, artwork and trademarks belong to their respective publishers
          and developers. Buying a game gives you the licence that game provides —
          per the{" "}
          <Link href="/terms" className={inlineLink}>
            terms of service
          </Link>
          .
        </p>
      </Section>

      <Section title="Is GameHub open source?">
        <p>
          Yes — the store is built in the open. The source is published on{" "}
          <a
            href="https://github.com/naheel0/GameHub-fullstack"
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLink}
          >
            GitHub
          </a>
          .
        </p>
      </Section>

      <Section title="Something else?">
        <p>
          The{" "}
          <Link href="/contact" className={inlineLink}>
            contact page
          </Link>{" "}
          has the form and everything we can help with.
        </p>
        <ContactLine />
      </Section>
    </>
  );
}
