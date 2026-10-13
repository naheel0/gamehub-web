import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Shipping & delivery — GameHub",
  description:
    "GameHub sells digital games: nothing ships physically. Purchases appear in your account once payment is confirmed, with no delivery charges.",
};

export default function ShippingPage() {
  return (
    <>
      <Kicker>Legal · Effective October 13, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Shipping &amp; delivery</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        GameHub sells digital games — there is nothing to pack, post or track. Here,
        &ldquo;delivery&rdquo; means your purchase arriving in your account.
      </p>

      <Section title="What delivery means">
        <p>
          When an order&apos;s payment is confirmed, the purchase appears in your
          order history on the{" "}
          <Link href="/profile" className={inlineLink}>
            profile page
          </Link>
          . That is delivery — there is no physical step in between, so it happens as
          soon as the payment succeeds.
        </p>
      </Section>

      <Section title="Delivery charges">
        <p>
          There are none. The costs of an order are the game&apos;s price and any tax
          shown on the order before you pay — nothing is added for shipping, because
          nothing ships.
        </p>
      </Section>

      <Section title="Why we ask for an address">
        <p>
          Orders collect a billing address for payment and record-keeping. Nothing
          physical is ever sent there.
        </p>
      </Section>

      <Section title="If your purchase has not arrived">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Check the order on your{" "}
            <Link href="/profile" className={inlineLink}>
              profile page
            </Link>{" "}
            — delivered purchases are listed there.
          </li>
          <li>
            If it is missing or does not work as described, the{" "}
            <Link href="/refunds" className={inlineLink}>
              refund policy
            </Link>{" "}
            covers it — request it within 7 days of purchase.
          </li>
          <li>
            Email{" "}
            <a href="mailto:support@gamehub.com" className={inlineLink}>
              support@gamehub.com
            </a>{" "}
            with the order ID and we will look into it.
          </li>
        </ol>
      </Section>

      <Section title="Questions">
        <ContactLine />
      </Section>
    </>
  );
}
