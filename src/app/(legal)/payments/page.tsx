import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Payment policy — GameHub",
  description:
    "GameHub payments are processed through Razorpay in Indian rupees: accepted methods, when you are charged, failed payments and refunds.",
};

export default function PaymentsPage() {
  return (
    <>
      <Kicker>Legal · Effective October 13, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Payment policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Every payment on GameHub is processed by Razorpay, a third-party payment
        provider, in Indian rupees.
      </p>

      <Section title="Accepted payment methods">
        <p>
          The methods available to you — for example cards, UPI and netbanking — are
          offered and shown by Razorpay in its checkout, and can vary by bank or
          account. GameHub is a digital store, so there is no cash-on-delivery
          option.
        </p>
      </Section>

      <Section title="When you are charged">
        <p>
          You are charged when you place the order. If the payment succeeds, the
          order is placed and the purchase is delivered to your account; any tax on
          the order is shown before you confirm. If the payment does not go through,
          no order is placed.
        </p>
      </Section>

      <Section title="Failed or interrupted payments">
        <p>
          If a payment fails at checkout, the order is not placed and your cart is
          untouched — you can try again. If your bank shows the money as deducted
          anyway, it is normally reversed by the bank or provider on its own; if it
          has not appeared back within a few working days, email us with the details
          and we will help trace it.
        </p>
      </Section>

      <Section title="Refunds">
        <p>
          Approved refunds go back through the original payment method — see the{" "}
          <Link href="/refunds" className={inlineLink}>
            refund policy
          </Link>{" "}
          for what qualifies and how to ask.
        </p>
      </Section>

      <Section title="Payment details">
        <p>
          Card numbers, UPI IDs and similar payment details are handled by Razorpay
          under its own terms — GameHub does not collect or store them.
        </p>
        <ContactLine />
      </Section>
    </>
  );
}
