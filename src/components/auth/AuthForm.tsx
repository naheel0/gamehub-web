"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Eye, EyeSlash, PaperPlaneRight } from "@/components/ui/icons";

/**
 * The one auth form (login + OTP signup). All three endpoints are proxied
 * server-side (no CORS, tokens never touch this component). Backend has no
 * server-side field validation, so client validation is the real gate:
 * required fields, email shape, OTP = 6 digits, password confirmation.
 * Errors from the backend surface verbatim (role="alert"); success replaces
 * the form with a signed-in panel. Signup = send-otp → verify-and-register.
 */
type User = { id?: number; email?: string; firstName?: string };

type Field = "email" | "otp" | "password" | "confirmPassword" | "firstName" | "lastName" | "phone";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // signup only: 1 = email, 2 = OTP + details
  const [values, setValues] = useState<Record<Field, string>>({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null); // send-otp success message
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reveal, setReveal] = useState(false);
  const [agreed, setAgreed] = useState(false); // signup step 2: Terms + Privacy consent
  const [consentError, setConsentError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  const set = (f: Field, v: string) => {
    setValues((prev) => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
  };

  // resend cooldown — real time, ticks down to a re-enabled button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validateEmail = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!values.email.trim()) e.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      e.email = "That email address doesn't look right.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const post = async (url: string, body: unknown) => {
    setBusy(true);
    setServerError(null);
    setStatus(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: User;
      };
      return { ok: res.ok, ...json };
    } catch {
      return { ok: false, message: "We couldn't reach the store right now. Refresh in a moment." };
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = async () => {
    if (!validateEmail()) return;
    const r = await post("/api/auth/login", {
      email: values.email.trim(),
      password: values.password,
    });
    if (!r.ok) {
      setServerError(r.message ?? "Sign-in failed. Try again.");
      return;
    }
    setUser(r.user ?? {});
  };

  const submitOtpStep = async () => {
    if (!validateEmail()) return;
    const r = await post("/api/auth/send-otp", { email: values.email.trim() });
    if (!r.ok) {
      setServerError(r.message ?? "We couldn't send the code. Try again.");
      return;
    }
    setStatus(r.message ?? "Code sent. Check your inbox.");
    setStep(2);
    setCooldown(30);
    requestAnimationFrame(() => otpRef.current?.focus());
  };

  const submitRegister = async () => {
    if (!agreed) {
      setConsentError("Agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    const e: Partial<Record<Field, string>> = {};
    if (!/^\d{6}$/.test(values.otp.trim())) e.otp = "Enter the 6-digit code from your email.";
    if (!values.firstName.trim()) e.firstName = "Enter your first name.";
    if (!values.lastName.trim()) e.lastName = "Enter your last name.";
    if (!values.phone.trim()) e.phone = "Enter your phone number.";
    if (!values.password) e.password = "Choose a password.";
    else if (values.password.length < 6) e.password = "Use at least 6 characters.";
    if (values.confirmPassword !== values.password) e.confirmPassword = "Passwords don't match.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const r = await post("/api/auth/verify-and-register", {
      email: values.email.trim(),
      otp: values.otp.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
    });
    if (!r.ok) {
      setServerError(r.message ?? "Registration failed. Try again.");
      return;
    }
    // Consent receipt — lives in this browser only; ponytail: no backend
    // endpoint records consent yet, move it server-side when one exists
    try {
      localStorage.setItem(
        "gh_terms",
        JSON.stringify({ agreedAt: new Date().toISOString(), version: "2026-10-12" }),
      );
    } catch {
      // storage blocked: the gate above still enforced consent
    }
    setUser(r.user ?? {});
  };

  // ---- success: signed in (real cookie set server-side) ----
  if (user) {
    // ?next= read client-side at click time (page stays static; guards open redirect)
    const go = () => {
      const raw = new URLSearchParams(window.location.search).get("next");
      const destination = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/games";
      router.push(destination);
    };
    return (
      <div className="border border-line bg-surface/80 p-8" role="status">
        <CheckCircle
          className="h-10 w-10 text-accent badge-pop"
          weight="fill"
          aria-hidden="true"
        />
        <h2 className="mt-4 font-display text-4xl leading-none uppercase">
          {mode === "login" ? "Welcome back" : "Welcome to the arena"}
          {user.firstName ? `, ${user.firstName}` : ""}
        </h2>
        <p className="mt-3 font-mono text-xs tracking-[0.1em] text-muted">
          Signed in as {user.email ?? values.email}
        </p>
        <button
          type="button"
          onClick={go}
          className="group mt-7 inline-flex h-12 items-center gap-2 bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
        >
          Enter the store
          <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    );
  }

  const inputCls =
    "h-12 w-full border border-line bg-bg px-4 font-mono text-sm tracking-[0.04em] text-heading transition-shadow duration-200 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none";

  const err = (f: Field) =>
    errors[f] ? (
      <p key={errors[f]} className="deal-in mt-1.5 font-mono text-[11px] text-accent">
        {errors[f]}
      </p>
    ) : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (mode === "login") void submitLogin();
        else if (step === 1) void submitOtpStep();
        else void submitRegister();
      }}
      className="border border-line bg-surface/80 p-6 sm:p-8"
    >
      {serverError && (
        <p
          key={serverError}
          role="alert"
          className="deal-in mb-5 border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text"
        >
          {serverError}
        </p>
      )}
      {status && step === 2 && (
        <p key={status} className="deal-in mb-5 border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text">
          {status} The code expires in 10 minutes.
        </p>
      )}

      {/* email — always visible */}
      <div>
        <label htmlFor="auth-email" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          Email
        </label>
        <input
          id="auth-email"
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

      {mode === "login" ? (
        <>
          <div className="mt-5">
            <label htmlFor="auth-password" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="auth-password"
                type={reveal ? "text" : "password"}
                autoComplete="current-password"
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                aria-invalid={!!errors.password}
                className={`${inputCls} pr-12`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted transition-colors duration-200 hover:text-accent"
              >
                {reveal ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err("password")}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="group mt-7 flex h-12 w-full items-center justify-center gap-2 bg-accent font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
            {!busy && (
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            )}
          </button>

          <p className="mt-5 text-center font-mono text-xs text-muted">
            New to GameHub?{" "}
            <Link href="/signup" className="text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
              Create an account
            </Link>
          </p>
        </>
      ) : step === 1 ? (
        <>
          <p className="mt-4 text-sm text-muted">
            We&apos;ll email you a 6-digit code to verify it&apos;s you. No spam — one code, ten minutes.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="group mt-7 flex h-12 w-full items-center justify-center gap-2 bg-accent font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Sending code…" : "Send verification code"}
            {!busy && <PaperPlaneRight className="h-5 w-5" />}
          </button>
          <p className="mt-5 text-center font-mono text-xs text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="mt-5">
            <label htmlFor="auth-otp" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Verification code
            </label>
            <input
              ref={otpRef}
              id="auth-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={values.otp}
              onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!errors.otp}
              className={`${inputCls} mt-2 text-center text-lg tracking-[0.5em]`}
              placeholder="000000"
            />
            {err("otp")}
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void submitOtpStep()}
              className="mt-3 font-mono text-[11px] tracking-[0.12em] text-muted uppercase underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-accent disabled:no-underline"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="auth-first" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                First name
              </label>
              <input
                id="auth-first"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                aria-invalid={!!errors.firstName}
                className={`mt-2 ${inputCls}`}
              />
              {err("firstName")}
            </div>
            <div>
              <label htmlFor="auth-last" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                Last name
              </label>
              <input
                id="auth-last"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                aria-invalid={!!errors.lastName}
                className={`mt-2 ${inputCls}`}
              />
              {err("lastName")}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="auth-phone" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Phone
            </label>
            <input
              id="auth-phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={!!errors.phone}
              className={`mt-2 ${inputCls}`}
            />
            {err("phone")}
          </div>

          <div className="mt-5">
            <label htmlFor="auth-new-password" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="auth-new-password"
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                aria-invalid={!!errors.password}
                className={`${inputCls} pr-12`}
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted transition-colors duration-200 hover:text-accent"
              >
                {reveal ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {err("password")}
          </div>

          <div className="mt-5">
            <label htmlFor="auth-confirm" className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              Confirm password
            </label>
            <input
              id="auth-confirm"
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              aria-invalid={!!errors.confirmPassword}
              className={`mt-2 ${inputCls}`}
            />
            {err("confirmPassword")}
          </div>

          <div className="mt-6">
            <label htmlFor="auth-consent" className="flex cursor-pointer items-start gap-3">
              <input
                id="auth-consent"
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (consentError) setConsentError(null);
                }}
                aria-invalid={!!consentError}
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ accentColor: "var(--color-accent)" }}
              />
              <span className="text-xs leading-relaxed text-muted">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {consentError && (
              <p key={consentError} role="alert" className="deal-in mt-1.5 font-mono text-[11px] text-accent">
                {consentError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 bg-accent font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setServerError(null);
              setStatus(null);
            }}
            className="mt-4 w-full text-center font-mono text-xs text-muted underline decoration-dotted underline-offset-4 hover:text-accent"
          >
            Use a different email
          </button>
        </>
      )}
    </form>
  );
}
