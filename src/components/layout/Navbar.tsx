"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, List, ShoppingCartSimple, X } from "@/components/ui/icons";

/**
 * Navbar v3 — poster-loud: the header stops opting out of the system's
 * strongest moves. Big Shoulders poster caps carry the nav, the logo's
 * slash lean is drawn as the active-route underline (crimson + aria-current,
 * never color alone), the arena CTA is sheared to match the mark, and the
 * bar lifts off the page on scroll. The one authored motion moment is the
 * badge pop when counts resolve; the drawer rises staggered (open-only —
 * close stays instant rather than pulling in an exit-animation library).
 * Session semantics are unchanged from v2: resolve once after mount,
 * pending = empty slot (never a false "signed out"), cart/wishlist badges
 * are live links to /cart and /wishlist (they re-resolve on the
 * `counts:changed` event every mutation announces), drawer keeps
 * Escape/focus-return/Tab cycle/scroll lock/portal. Motion is CSS-only (animation-orchestrator: simple
 * micro-interactions in an always-loaded component — no new runtime).
 */

type Session =
  | { status: "pending" }
  | { status: "anon" }
  | {
      status: "in";
      firstName?: string;
      email?: string;
      cartCount?: number | null;
      wishlistCount?: number | null;
    };

const SHEAR = "[clip-path:polygon(9px_0,100%_0,calc(100%_-_9px)_100%,0_100%)]";

function LogoMark() {
  // crimson arena slash — authored SVG, one consistent stroke
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
      <path d="M4 24 L14 4 L18 4 L8 24 Z" fill="#ff2d55" />
      <path d="M14 24 L24 4 L28 4 L18 24 Z" fill="#f4f1f2" />
    </svg>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  // the mark's lean, drawn as the active underline; hover previews it muted
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group relative font-display text-[1.35rem] leading-none tracking-[0.03em] text-muted uppercase transition-colors duration-200 hover:text-heading"
    >
      {children}
      <span
        aria-hidden="true"
        className={`absolute -bottom-2 left-0 h-0.5 w-full origin-left -skew-x-[26deg] transition-transform duration-200 group-hover:scale-x-100 ${
          active ? "scale-x-100 bg-accent" : "scale-x-0 bg-heading/40"
        }`}
      />
    </Link>
  );
}

function CountIcon({
  icon: Icon,
  label,
  count,
  showLabel,
  href,
  active,
  className = "text-muted",
}: {
  icon: ElementType;
  label: string;
  count: number | null | undefined;
  showLabel?: boolean;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  // badge = real count; with an href the badge is the destination itself
  const announced =
    count == null ? label : `${label} — ${count} ${count === 1 ? "item" : "items"}`;
  const badge = (
    <span className="relative inline-flex">
      <Icon className="h-5 w-5" aria-hidden />
      {count ? (
        // key = remount on change: the pop replays on every count move
        <span
          key={count}
          className="badge-pop absolute -top-2 -right-2.5 grid min-w-4.5 place-items-center rounded-full bg-accent px-1 pt-px font-mono text-[10px] leading-4 text-bg"
        >
          {count}
        </span>
      ) : null}
    </span>
  );
  const text = showLabel ? (
    <span className="font-mono text-xs tracking-[0.14em] uppercase">{label}</span>
  ) : null;

  if (!href) {
    return (
      <span role="img" aria-label={announced} className={`inline-flex items-center gap-2 ${className}`}>
        {badge}
        {text}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={announced}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-2 transition-colors duration-200 hover:text-heading ${
        active ? "text-heading" : ""
      } ${className}`}
    >
      {badge}
      {text}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session>({ status: "pending" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const loadSession = () =>
      fetch("/api/auth/session")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { user?: { firstName?: string; email?: string } | null; cartCount?: number | null; wishlistCount?: number | null }) => {
          if (!live) return;
          setSession(
            d.user
              ? {
                  status: "in",
                  firstName: d.user.firstName,
                  email: d.user.email,
                  cartCount: d.cartCount ?? null,
                  wishlistCount: d.wishlistCount ?? null,
                }
              : { status: "anon" },
          );
        })
        .catch(() => {
          /* network/502 → keep current state: never claim signed-out we didn't verify */
        });
    loadSession();
    // every cart/wishlist mutation announces → badges follow without refetch loops
    window.addEventListener("counts:changed", loadSession);
    return () => {
      live = false;
      window.removeEventListener("counts:changed", loadSession);
    };
  }, []);

  // scroll-lift: functional set bails out when the threshold state is unchanged
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 8;
      setScrolled((s) => (s === next ? s : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the drawer when the route changes (render-phase adjust, not an effect)
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  // drawer lifecycle: scroll lock, Escape, focus in/out, Tab containment
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = drawerRef.current?.querySelectorAll<HTMLElement>("a,button");
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSession({ status: "anon" });
    setMenuOpen(false);
  };

  const cartCount = session.status === "in" ? session.cartCount : undefined;
  const wishlistCount = session.status === "in" ? session.wishlistCount : undefined;
  const onStore = pathname === "/games" || pathname.startsWith("/games/");

  const account =
    session.status === "pending" ? (
      <span aria-hidden="true" className="w-16" />
    ) : session.status === "anon" ? (
      <Link
        href="/login"
        className="border border-line px-4 py-1.5 font-display text-xl leading-none tracking-wide text-heading uppercase transition-colors duration-200 hover:border-accent hover:text-accent"
      >
        Sign in
      </Link>
    ) : (
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-2 border border-line bg-surface px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-display text-xl leading-none tracking-wide text-heading uppercase">
            {session.firstName || "Account"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm tracking-[0.16em] text-muted uppercase transition-colors duration-200 hover:text-heading"
        >
          Sign out
        </button>
      </span>
    );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-line backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-bg/95 shadow-lg" : "bg-bg/90"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:gap-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl leading-none tracking-wide text-heading uppercase">
            GameHub
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex lg:gap-9">
          <NavLink href="/games" active={onStore}>
            Store
          </NavLink>
          <NavLink href="/#genres">Genres</NavLink>
          <CountIcon
            icon={ShoppingCartSimple}
            label="Cart"
            count={cartCount}
            href="/cart"
            active={pathname === "/cart"}
          />
          <CountIcon
            icon={Heart}
            label="Wishlist"
            count={wishlistCount}
            href="/wishlist"
            active={pathname === "/wishlist"}
          />
          {account}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/games" className="hidden lg:block">
            <span
              className={`block bg-accent px-6 py-2.5 text-sm font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 ${SHEAR}`}
            >
              Browse the store
            </span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center text-heading transition-colors duration-200 hover:text-accent md:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* portal to body: the header's backdrop-blur would otherwise become
          the containing block for this position:fixed drawer */}
      {menuOpen &&
        createPortal(
        <div
          id="mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMenuOpen(false);
          }}
          className="drawer-in fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-5 overflow-y-auto bg-bg/95 px-5 py-7 backdrop-blur-md md:hidden"
        >
          <Link href="/games" className="font-display text-3xl leading-none text-heading uppercase transition-colors duration-200 hover:text-accent">
            Store
          </Link>
          <Link href="/#genres" className="font-display text-3xl leading-none text-heading uppercase transition-colors duration-200 hover:text-accent">
            Genres
          </Link>

          <div className="flex items-center gap-7 border-t border-line pt-5 text-heading">
            <CountIcon
              icon={ShoppingCartSimple}
              label="Cart"
              count={cartCount}
              showLabel
              href="/cart"
              active={pathname === "/cart"}
            />
            <CountIcon
              icon={Heart}
              label="Wishlist"
              count={wishlistCount}
              showLabel
              href="/wishlist"
              active={pathname === "/wishlist"}
            />
          </div>

          <div className="border-t border-line pt-5">
            {session.status === "pending" ? null : session.status === "anon" ? (
              <Link
                href="/login"
                className="font-display text-3xl leading-none text-heading uppercase transition-colors duration-200 hover:text-accent"
              >
                Sign in
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 border border-line bg-surface px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span className="font-display text-2xl leading-none text-heading uppercase">
                    {session.firstName || "Account"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-sm tracking-[0.16em] text-muted uppercase transition-colors duration-200 hover:text-heading"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          <Link href="/games" className="mt-auto block">
            <span
              className={`block bg-accent px-5 py-3 text-center text-sm font-semibold text-bg ${SHEAR}`}
            >
              Browse the store
            </span>
          </Link>
        </div>,
        document.body,
      )}
    </header>
  );
}
