"use client";

import { useState, type FormEvent } from "react";
import { CaretDown, CheckCircle, PaperPlaneRight } from "@/components/ui/icons";

/** UI-only contact form — validates and plays the full send UX (pending →
 *  success card), but the submit is simulated: no backend endpoint exists
 *  yet. ponytail: swap the setTimeout in onSubmit for a real POST when
 *  support wants the inbox wired up. */

const SHEAR = "[clip-path:polygon(9px_0,100%_0,calc(100%_-_9px)_100%,0_100%)]";
const TOPICS = [
  "Order help",
  "Refund or cancellation",
  "Account",
  "Payment",
  "Something else",
];

const FIELD =
  "mt-2 w-full border bg-surface/60 px-3 text-sm text-text caret-accent outline-none transition-colors duration-200 placeholder:text-muted hover:border-white/20";
const LABEL = "font-mono text-xs tracking-[0.14em] text-muted uppercase";
const ERROR = "mt-2 font-mono text-xs text-accent";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = "Enter a valid email so we can reply.";
    if (message.trim().length < 10)
      next.message = "A few more details, please — at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setState("sending");
    // ponytail: simulated send — replace with a real POST once an endpoint exists
    window.setTimeout(() => setState("sent"), 900);
  };

  if (state === "sent") {
    return (
      <div role="status" className="deal-in border border-line bg-surface px-7 py-10 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
        <p className="mt-5 font-mono text-xs tracking-[0.16em] text-accent uppercase">
          Message sent
        </p>
        <h2 className="mt-2 font-display text-3xl uppercase">We&apos;ll be in touch</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted">
          Thanks, {name.trim() || "friend"} — a reply will land at{" "}
          <span className="text-heading">{email.trim()}</span>. Prefer email? Write to{" "}
          <a
            href="mailto:support@gamehub.com"
            className="text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
          >
            support@gamehub.com
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setName("");
            setEmail("");
            setMessage("");
            setErrors({});
          }}
          className="mt-7 inline-flex h-10 items-center border border-line px-5 font-display text-lg tracking-[0.04em] text-heading uppercase transition-colors duration-200 hover:border-accent"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="border border-line bg-surface px-6 py-8 sm:px-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={LABEL}>
            Name
          </label>
          <input
            id="cf-name"
            name="name"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
            placeholder="Your name"
            className={`${FIELD} h-11 ${errors.name ? "border-accent" : "border-line"}`}
          />
          {errors.name && (
            <p id="cf-name-err" className={ERROR}>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="cf-email" className={LABEL}>
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-err" : undefined}
            placeholder="you@example.com"
            className={`${FIELD} h-11 ${errors.email ? "border-accent" : "border-line"}`}
          />
          {errors.email && (
            <p id="cf-email-err" className={ERROR}>
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="cf-topic" className={LABEL}>
          Topic
        </label>
        <div className="relative">
          <select
            id="cf-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={`${FIELD} h-11 appearance-none border-line pr-10`}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <CaretDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="cf-message" className={LABEL}>
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
          placeholder="Order ID if you have one (profile → Orders), then what happened."
          className={`${FIELD} resize-y py-3 ${errors.message ? "border-accent" : "border-line"}`}
        />
        {errors.message && (
          <p id="cf-message-err" className={ERROR}>
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className={`mt-7 flex h-12 w-full items-center justify-center gap-2.5 bg-accent font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70 ${SHEAR}`}
      >
        <PaperPlaneRight className="h-4 w-4" aria-hidden="true" />
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
      <p className="mt-4 text-center font-mono text-xs tracking-wider text-muted">
        We reply from support@gamehub.com — never ask for your password or payment
        details.
      </p>
    </form>
  );
}
