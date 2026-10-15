"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, UserCircle } from "@/components/ui/icons";
import { announceCounts, storeCall, type StoreResult } from "@/lib/store";
import type { ApiEnvelope, ProfileUser } from "@/lib/types";
import AddressBook from "./AddressBook";
import OrderHistory from "./OrderHistory";

/**
 * Profile body: one auth probe (GET profile) gates three tab panels —
 * details (edit via PUT, email conflict surfaces the backend message),
 * addresses, and orders. Panels stay mounted once visited so an in-progress
 * address form survives tab switches. A profile save announces counts so
 * the navbar chip follows the name change.
 */
type State =
  | { k: "loading" }
  | { k: "gate" }
  | { k: "error"; message: string }
  | { k: "ready"; user: ProfileUser };

type Tab = "details" | "addresses" | "orders";
type Field = "firstName" | "lastName" | "email" | "phone";

const TABS: [Tab, string][] = [
  ["details", "Details"],
  ["addresses", "Addresses"],
  ["orders", "Orders"],
];

const inputCls =
  "h-12 w-full border border-line bg-bg px-4 font-mono text-sm tracking-[0.04em] text-heading transition-shadow duration-200 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none";

export default function ProfileClient() {
  const [state, setState] = useState<State>({ k: "loading" });
  const [tab, setTab] = useState<Tab>("details");
  const [visited, setVisited] = useState<Tab[]>(["details"]);

  // details form
  const [values, setValues] = useState<Record<Field, string>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const read = (r: StoreResult<ApiEnvelope<ProfileUser>>) => {
    if (r.ok && r.data?.success && r.data.data) {
      const u = r.data.data;
      setState({ k: "ready", user: u });
      setValues({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone });
    } else if (!r.ok && r.status === 401) {
      setState({ k: "gate" });
    } else {
      setState({ k: "error", message: !r.ok ? r.message : (r.data?.message ?? "We couldn't load your profile right now. Refresh and try again.") });
    }
  };

  useEffect(() => {
    let live = true;
    storeCall<ApiEnvelope<ProfileUser>>("GET", "/api/profile").then((r) => {
      if (live) read(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const retry = () => {
    setState({ k: "loading" });
    storeCall<ApiEnvelope<ProfileUser>>("GET", "/api/profile").then(read);
  };

  const set = (f: Field, v: string) => {
    setValues((prev) => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
  };

  const save = async () => {
    const e: Partial<Record<Field, string>> = {};
    if (!values.firstName.trim()) e.firstName = "Enter your first name.";
    if (!values.lastName.trim()) e.lastName = "Enter your last name.";
    if (!values.email.trim()) e.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      e.email = "That email address doesn't look right.";
    if (!values.phone.trim()) e.phone = "Enter your phone number.";
    setErrors(e);
    if (Object.keys(e).length > 0 || busy) return;

    setBusy(true);
    setFormError(null);
    setSaved(null);
    const r = await storeCall<ApiEnvelope<ProfileUser>>("PUT", "/api/profile", {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
    setBusy(false);
    if (!r.ok) {
      if (r.status === 401) setState({ k: "gate" });
      // 400s (email already taken, etc.) surface the backend message verbatim
      setFormError(r.message);
      return;
    }
    if (r.data?.success && r.data.data) {
      const u = r.data.data;
      setState({ k: "ready", user: u });
      setValues({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone });
    }
    setSaved("Profile updated.");
    announceCounts(); // navbar chip follows the name change
  };

  if (state.k === "loading") {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="h-14 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
        <div className="h-72 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
      </div>
    );
  }

  if (state.k === "gate") {
    return (
      <div className="border border-line bg-surface px-6 py-12 text-center">
        <UserCircle className="mx-auto h-8 w-8 text-accent" weight="bold" aria-hidden />
        <h2 className="mt-4 font-display text-3xl uppercase">Sign in to see your profile</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-text">
          Your details, addresses, and orders ride with your account — sign in and it&apos;s all here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
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
        <h2 className="font-display text-3xl uppercase">We couldn&apos;t load your profile</h2>
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

  const { user } = state;
  const go = (t: Tab) => {
    setTab(t);
    setVisited((v) => (v.includes(t) ? v : [...v, t]));
  };

  const err = (f: Field) =>
    errors[f] ? <p className="mt-1.5 font-mono text-[11px] text-accent">{errors[f]}</p> : null;

  return (
    <div>
      {/* section tabs — HUD hairline row, accent underline on active */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex flex-wrap items-end gap-x-2 border-b border-line"
      >
        {TABS.map(([value, label]) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              id={`profile-tab-${value}`}
              aria-selected={active}
              aria-controls={`profile-panel-${value}`}
              onClick={() => go(value)}
              className={`relative px-4 py-3 font-display text-xl leading-none tracking-[0.03em] uppercase transition-colors duration-200 sm:text-2xl ${
                active ? "text-heading" : "text-muted hover:text-heading"
              }`}
            >
              {label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-200 ${
                  active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* details — always mounted. Active panel gains deal-in on tab change:
          class-toggle replay with no remount, so form state survives */}
      <div
        role="tabpanel"
        id="profile-panel-details"
        aria-labelledby="profile-tab-details"
        hidden={tab !== "details"}
        className={`pt-6 ${tab === "details" ? "deal-in" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="border border-line bg-surface px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            {user.role}
          </span>
          <span className="border border-line bg-surface px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            {user.status}
          </span>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-5 max-w-2xl border border-line bg-surface/80 p-6 sm:p-8"
        >
          {formError && (
            <p key={formError} role="alert" className="deal-in mb-5 border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text">
              {formError}
            </p>
          )}
          {saved && (
            <p key={saved} role="status" className="deal-in mb-5 flex items-center gap-2 border-l-2 border-accent/60 bg-bg px-4 py-3 font-mono text-xs text-muted">
              <CheckCircle className="h-4 w-4 text-accent" weight="fill" aria-hidden />
              {saved}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-first" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                First name
              </label>
              <input
                id="profile-first"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                aria-invalid={!!errors.firstName}
                className={`mt-2 ${inputCls}`}
              />
              {err("firstName")}
            </div>
            <div>
              <label htmlFor="profile-last" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Last name
              </label>
              <input
                id="profile-last"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                aria-invalid={!!errors.lastName}
                className={`mt-2 ${inputCls}`}
              />
              {err("lastName")}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="profile-email" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={!!errors.email}
              className={`mt-2 ${inputCls}`}
              placeholder="you@example.com"
            />
            {err("email")}
          </div>

          <div className="mt-4">
            <label htmlFor="profile-phone" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={!!errors.phone}
              className={`mt-2 ${inputCls}`}
            />
            {err("phone")}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* addresses — mounted once visited so a half-typed form survives */}
      {visited.includes("addresses") && (
        <div
          role="tabpanel"
          id="profile-panel-addresses"
          aria-labelledby="profile-tab-addresses"
          hidden={tab !== "addresses"}
          className={`pt-6 ${tab === "addresses" ? "deal-in" : ""}`}
        >
          <AddressBook />
        </div>
      )}

      {/* orders */}
      {visited.includes("orders") && (
        <div
          role="tabpanel"
          id="profile-panel-orders"
          aria-labelledby="profile-tab-orders"
          hidden={tab !== "orders"}
          className={`pt-6 ${tab === "orders" ? "deal-in" : ""}`}
        >
          <OrderHistory />
        </div>
      )}
    </div>
  );
}
