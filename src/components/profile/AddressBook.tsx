"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash } from "@/components/ui/icons";
import { storeCall, type StoreResult } from "@/lib/store";
import type { Address } from "@/lib/types";

/**
 * Address book: cards with default badge / set-default / two-step delete,
 * plus one inline form shared by add and edit (POST returns the created row,
 * PUT/DELETE return {message} so the list updates locally). The add form
 * pre-checks "set as default" when the book is empty — the backend doesn't
 * auto-promote a first address.
 */
type State =
  | { k: "loading" }
  | { k: "error"; message: string }
  | { k: "ready"; addresses: Address[] };

type Mode = { kind: "closed" } | { kind: "add" } | { kind: "edit"; addressId: string };

type Field =
  | "fullName"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "zipCode"
  | "country"
  | "phone";

const EMPTY: Record<Field, string> = {
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phone: "",
};

const inputCls =
  "h-12 w-full border border-line bg-bg px-4 font-mono text-sm tracking-[0.04em] text-heading transition-shadow duration-200 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none";

export default function AddressBook() {
  const [state, setState] = useState<State>({ k: "loading" });
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [values, setValues] = useState<Record<Field, string>>(EMPTY);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null); // delete confirm

  const read = (r: StoreResult<Address[]>) => {
    if (r.ok) setState({ k: "ready", addresses: Array.isArray(r.data) ? r.data : [] });
    else setState({ k: "error", message: r.message });
  };

  useEffect(() => {
    let live = true;
    storeCall<Address[]>("GET", "/api/addresses").then((r) => {
      if (live) read(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const retry = () => {
    setState({ k: "loading" });
    storeCall<Address[]>("GET", "/api/addresses").then(read);
  };

  const set = (f: Field, v: string) => {
    setValues((prev) => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
  };

  const openAdd = () => {
    setValues(EMPTY);
    // first address isn't auto-default upstream — offer it here instead
    setIsDefault(state.k === "ready" && state.addresses.length === 0);
    setErrors({});
    setFormError(null);
    setFlash(null);
    setMode({ kind: "add" });
  };

  const openEdit = (a: Address) => {
    setValues({
      fullName: a.fullName,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      country: a.country,
      phone: a.phone,
    });
    setIsDefault(a.isDefault);
    setErrors({});
    setFormError(null);
    setFlash(null);
    setArmed(null);
    setMode({ kind: "edit", addressId: a.addressId });
  };

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!values.fullName.trim()) e.fullName = "Enter the recipient's name.";
    if (!values.addressLine1.trim()) e.addressLine1 = "Enter a street address.";
    if (!values.city.trim()) e.city = "Enter a city.";
    if (!values.state.trim()) e.state = "Enter a state.";
    if (!values.zipCode.trim()) e.zipCode = "Enter a ZIP code.";
    if (!values.country.trim()) e.country = "Enter a country.";
    if (!values.phone.trim()) e.phone = "Enter a phone number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || busy || state.k !== "ready") return;
    setBusy(true);
    setFormError(null);
    const payload = {
      fullName: values.fullName.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      zipCode: values.zipCode.trim(),
      country: values.country.trim(),
      phone: values.phone.trim(),
      isDefault,
    };

    if (mode.kind === "add") {
      const r = await storeCall<Address>("POST", "/api/addresses", payload);
      setBusy(false);
      if (!r.ok) {
        if (r.status === 401) setState({ k: "error", message: "Your session has expired. Sign in again." });
        else setFormError(r.message);
        return;
      }
      const created = r.data;
      setState((s) => {
        if (s.k !== "ready") return s;
        // default added → the previous default is demoted upstream
        const next = created.isDefault ? s.addresses.map((a) => ({ ...a, isDefault: false })) : s.addresses;
        return { k: "ready", addresses: [...next, created] };
      });
      setMode({ kind: "closed" });
      setFlash("Address added.");
      return;
    }

    if (mode.kind !== "edit") return;
    const r = await storeCall<{ message: string }>("PUT", `/api/addresses/${mode.addressId}`, payload);
    setBusy(false);
    if (!r.ok) {
      if (r.status === 401) setState({ k: "error", message: "Your session has expired. Sign in again." });
      else setFormError(r.message);
      return;
    }
    const id = mode.addressId;
    setState((s) => {
      if (s.k !== "ready") return s;
      return {
        k: "ready",
        addresses: s.addresses.map((a) =>
          a.addressId === id
            ? { ...a, ...payload }
            : isDefault
              ? { ...a, isDefault: false }
              : a,
        ),
      };
    });
    setMode({ kind: "closed" });
    setFlash("Address updated.");
  };

  const setDefault = async (a: Address) => {
    if (busy || state.k !== "ready") return;
    setBusy(true);
    const r = await storeCall<{ message: string }>("PUT", `/api/addresses/${a.addressId}/default`);
    setBusy(false);
    if (!r.ok) {
      setFlash(r.message);
      return;
    }
    setState((s) =>
      s.k === "ready"
        ? { k: "ready", addresses: s.addresses.map((x) => ({ ...x, isDefault: x.addressId === a.addressId })) }
        : s,
    );
    setFlash("Default address updated.");
  };

  const remove = async (a: Address) => {
    if (busy || state.k !== "ready") return;
    // two-step confirm — armed state resets only on success or another action
    if (armed !== a.addressId) {
      setArmed(a.addressId);
      return;
    }
    setBusy(true);
    const r = await storeCall<{ message: string }>("DELETE", `/api/addresses/${a.addressId}`);
    setBusy(false);
    if (!r.ok) {
      setFlash(r.message);
      return;
    }
    setState((s) =>
      s.k === "ready" ? { k: "ready", addresses: s.addresses.filter((x) => x.addressId !== a.addressId) } : s,
    );
    setArmed(null);
    setFlash("Address removed.");
  };

  if (state.k === "loading") {
    return (
      <div aria-busy="true" className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-44 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (state.k === "error") {
    return (
      <div className="border border-line bg-surface px-6 py-10 text-center">
        <h2 className="font-display text-3xl uppercase">We couldn&apos;t load your addresses</h2>
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

  const { addresses } = state;

  const err = (f: Field) =>
    errors[f] ? <p className="mt-1.5 font-mono text-[11px] text-accent">{errors[f]}</p> : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
          {addresses.length} {addresses.length === 1 ? "address" : "addresses"}
        </p>
        {mode.kind === "closed" && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-10 items-center gap-2 bg-accent px-5 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" weight="bold" aria-hidden />
            Add address
          </button>
        )}
      </div>

      {flash && (
        <p key={flash} role="status" className="deal-in mt-4 border-l-2 border-accent/60 bg-surface px-4 py-2.5 font-mono text-xs text-muted">
          {flash}
        </p>
      )}

      {/* inline add/edit form */}
      {mode.kind !== "closed" && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mt-5 border border-line bg-surface/80 p-6"
        >
          <h2 className="font-display text-2xl uppercase">
            {mode.kind === "add" ? "Add an address" : "Edit address"}
          </h2>

          {formError && (
            <p key={formError} role="alert" className="deal-in mt-4 border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text">
              {formError}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="addr-name" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Full name
              </label>
              <input
                id="addr-name"
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                aria-invalid={!!errors.fullName}
                className={`mt-2 ${inputCls}`}
              />
              {err("fullName")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addr-line1" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Street address
              </label>
              <input
                id="addr-line1"
                autoComplete="address-line1"
                value={values.addressLine1}
                onChange={(e) => set("addressLine1", e.target.value)}
                aria-invalid={!!errors.addressLine1}
                className={`mt-2 ${inputCls}`}
              />
              {err("addressLine1")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addr-line2" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Apartment, suite, etc. <span className="normal-case">(optional)</span>
              </label>
              <input
                id="addr-line2"
                autoComplete="address-line2"
                value={values.addressLine2}
                onChange={(e) => set("addressLine2", e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>
            <div>
              <label htmlFor="addr-city" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                City
              </label>
              <input
                id="addr-city"
                autoComplete="address-level2"
                value={values.city}
                onChange={(e) => set("city", e.target.value)}
                aria-invalid={!!errors.city}
                className={`mt-2 ${inputCls}`}
              />
              {err("city")}
            </div>
            <div>
              <label htmlFor="addr-state" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                State
              </label>
              <input
                id="addr-state"
                autoComplete="address-level1"
                value={values.state}
                onChange={(e) => set("state", e.target.value)}
                aria-invalid={!!errors.state}
                className={`mt-2 ${inputCls}`}
              />
              {err("state")}
            </div>
            <div>
              <label htmlFor="addr-zip" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                ZIP code
              </label>
              <input
                id="addr-zip"
                autoComplete="postal-code"
                inputMode="numeric"
                value={values.zipCode}
                onChange={(e) => set("zipCode", e.target.value)}
                aria-invalid={!!errors.zipCode}
                className={`mt-2 ${inputCls}`}
              />
              {err("zipCode")}
            </div>
            <div>
              <label htmlFor="addr-country" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Country
              </label>
              <input
                id="addr-country"
                autoComplete="country-name"
                value={values.country}
                onChange={(e) => set("country", e.target.value)}
                aria-invalid={!!errors.country}
                className={`mt-2 ${inputCls}`}
              />
              {err("country")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addr-phone" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Phone
              </label>
              <input
                id="addr-phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                aria-invalid={!!errors.phone}
                className={`mt-2 ${inputCls}`}
              />
              {err("phone")}
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            <span className="font-mono text-xs tracking-[0.1em] text-muted uppercase">
              Set as default address
            </span>
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "Saving…" : mode.kind === "add" ? "Add address" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setMode({ kind: "closed" })}
              disabled={busy}
              className="inline-flex h-12 items-center border border-line px-6 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* empty book */}
      {addresses.length === 0 && mode.kind === "closed" ? (
        <div className="mt-5 border border-line bg-surface px-6 py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted" weight="bold" aria-hidden />
          <h2 className="mt-4 font-display text-3xl uppercase">No addresses yet</h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-text">
            Add where your wins get delivered — it&apos;s one form and you&apos;re set for checkout.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-6 inline-flex h-11 items-center bg-accent px-6 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <li key={a.addressId} className="deal-in" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <article className="flex h-full flex-col border border-line bg-surface p-4 transition-colors duration-200 hover:border-accent/50 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl leading-tight uppercase text-heading">{a.fullName}</h3>
                  {a.isDefault && (
                    <span className="inline-flex shrink-0 items-center gap-1 border border-accent/60 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-accent uppercase">
                      <Star className="h-3 w-3" weight="fill" aria-hidden />
                      Default
                    </span>
                  )}
                </div>
                <address className="mt-2 not-italic text-sm leading-relaxed text-text">
                  {a.addressLine1}
                  {a.addressLine2 ? <>, {a.addressLine2}</> : null}
                  <br />
                  {a.city}, {a.state} {a.zipCode}
                  <br />
                  {a.country}
                  <br />
                  <span className="font-mono text-xs text-muted">{a.phone}</span>
                </address>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    disabled={busy || mode.kind !== "closed"}
                    className="inline-flex h-8 items-center gap-1.5 border border-line px-3 font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" weight="bold" aria-hidden />
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => void setDefault(a)}
                      disabled={busy}
                      className="inline-flex h-8 items-center border border-line px-3 font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(a)}
                    disabled={busy}
                    className={`inline-flex h-8 items-center gap-1.5 border px-3 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 disabled:opacity-50 ${
                      armed === a.addressId
                        ? "border-accent text-accent"
                        : "border-line text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    <Trash className="h-3.5 w-3.5" weight="bold" aria-hidden />
                    {armed === a.addressId ? "Confirm remove" : "Remove"}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
