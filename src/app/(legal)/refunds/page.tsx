import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Refund policy — GameHub",
  description:
    "GameHub's refund policy: faulty or undelivered purchases can be requested within 7 days by contacting us.",
};

export default function RefundsPage() {
  return (
    <>
      <Kicker>Legal · Effective October 12, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Refund policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Digital purchases should arrive and work as described. If yours did not, we make it
        right — contact us within 7 days of purchase.
      </p>

      <Section title="What qualifies">
        <p>If either of these happened, you are covered:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-heading">Not delivered</strong> — your purchase does not
            show up in your account or order history.
          </li>
          <li>
            <strong className="text-heading">Faulty</strong> — what you received does not
            work as described on the store page.
          </li>
        </ul>
        <p>Request a refund within 7 days of the purchase date.</p>
      </Section>

      <Section title="What does not qualify">
        <ul className="list-disc space-y-2 pl-5">
          <li>Change of mind after a purchase was delivered to your account.</li>
          <li>Issues caused by your own device, region settings or account details.</li>
          <li>Requests made more than 7 days after the purchase date.</li>
        </ul>
        <p>
          Nothing here limits any right you have under applicable consumer law that cannot
          be excluded.
        </p>
      </Section>

      <Section title="How to request one">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Find your order ID on the{" "}
            <Link href="/profile" className={inlineLink}>
              profile page
            </Link>{" "}
            under Orders.
          </li>
          <li>
            Email{" "}
            <a href="mailto:contact@gamehub.com" className={inlineLink}>
              contact@gamehub.com
            </a>{" "}
            with the order ID and what went wrong.
          </li>
          <li>We review it and reply with the outcome.</li>
        </ol>
      </Section>

      <Section title="How refunds are paid">
        <p>
          Approved refunds go back through your original payment method. How quickly it
          appears depends on your bank or payment provider after we send it. Orders we
          cancel ourselves (for example, a listing error) are refunded the same way.
        </p>
      </Section>

      <Section title="Questions">
        <ContactLine />
      </Section>
    </>
  );
}
