import type { Metadata } from "next";
import Link from "next/link";
import { Kicker, Section, inlineLink } from "../legal-ui";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact us — GameHub",
  description:
    "Contact GameHub support: orders, refunds, cancellations, account access and payment questions — email us or use the form on this page.",
};

export default function ContactPage() {
  return (
    <>
      <Kicker>Support · GameHub</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Contact us</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        A question about an order, an account or the store itself — this is the page
        for it. The form below composes a message straight to our support inbox,
        sent from your own email app.
      </p>

      <Section title="What we can help with">
        <ul className="list-disc space-y-2 pl-5">
          <li>Orders and delivery — a purchase that has not arrived in your account.</li>
          <li>
            <Link href="/refunds" className={inlineLink}>
              Refunds
            </Link>{" "}
            and{" "}
            <Link href="/cancellation" className={inlineLink}>
              cancellations
            </Link>{" "}
            — requests within the policy windows.
          </li>
          <li>
            Account access — sign-in codes, or telling us promptly if someone else may
            have been in your account.
          </li>
          <li>
            <Link href="/payments" className={inlineLink}>
              Payments
            </Link>{" "}
            — a failed or double-charged payment we can help trace.
          </li>
          <li>
            Anything else about how GameHub works — the{" "}
            <Link href="/faq" className={inlineLink}>
              FAQ
            </Link>{" "}
            and policies cover most of it.
          </li>
        </ul>
      </Section>

      <Section title="Before you write">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Grab the order ID from Orders on your{" "}
            <Link href="/profile" className={inlineLink}>
              profile page
            </Link>{" "}
            — it gets answers moving faster.
          </li>
          <li>Write from the email tied to your account so we can match it.</li>
          <li>
            We never ask for your password or full payment details — do not share them
            with anyone.
          </li>
        </ul>
      </Section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-heading uppercase">
          Send a message
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text">
          The form opens your email app with everything filled in — hit send and it
          arrives as a normal mail to{" "}
          <a href="mailto:support@gamehub.com" className={inlineLink}>
            support@gamehub.com
          </a>
          .
        </p>
        <div className="mt-5">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
