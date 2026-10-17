"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  CaretDown,
  Heart,
  List,
  MagnifyingGlass,
  ShoppingCartSimple,
  SignOut,
  UserCircle,
  X,
} from "@/components/ui/icons";
import LogoMark from "@/components/ui/logo-mark";

/**
 * Navbar v4 — brand · links · actions. Three zones: the mark left, the
 * poster-caps links between them (Store → /games, Featured → /#featured,
 * Genres → /#genres; the logo's slash lean stays the active-route
 * underline — crimson + aria-current, never color alone), and one
 * right-hand action cluster: inline search that routes to the catalog's
 * real /games?q= state and clears on submit (the toolbar stays the live
 * source of truth), cart/wishlist badges (40px tap targets; badge-pop
 * replays on every count move), and ONE auth button in three states —
 * pending = empty slot (never a false "signed out"), anon = solid
 * "Sign in", signed-in = "● name ˅" opening a disclosure menu (email,
 * Profile, Sign out) closed by outside-click/Escape with focus returned
 * to the button. The sheared arena CTA is landing-only now (it duplicated
 * the Store link on every other route) and only fits the cluster at xl;
 * below lg the drawer carries everything: links → search → badges →
 * account → landing CTA, still portal'd to body (the header's backdrop-
 * blur would become the containing block for its position:fixed) with
 * Escape/focus-return/Tab cycle/scroll lock/backdrop close. Motion stays
 * CSS-only (animation-orchestrator: micro-interactions in always-loaded
 * chrome — badge-pop, staggered drawer rise, .menu-in fade+slide; all in
 * the reduced-motion kill list, close stays instant).
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

// one button family for every auth state + drawer CTA sibling
const AUTH_BTN =
  "inline-flex h-10 shrink-0 items-center gap-2 px-4 font-display text-lg leading-none tracking-[0.04em] uppercase transition-colors duration-200";

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
  // badge = real count; with an href the badge is the destination itself.
  // p-2.5 on the link = 40px hit area (icon is 20px) — tap-target floor.
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
      className={`inline-flex items-center gap-2 p-2.5 transition-colors duration-200 hover:text-heading ${
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
  const router = useRouter();
  const [session, setSession] = useState<Session>({ status: "pending" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const idSearch = useId();
  const idDrawerSearch = useId();
  const idAccount = useId();
  const idDrawerAccount = useId();

  useEffect(() => {
    let live = true;
    // after two straight failures the empty slot becomes "Sign in" — a real
    // session comes back with the next counts:changed fetch (ponytail:
    // event-driven recovery; no retry timer unless the backend outage
    // actually strands users)
    const failuresRef = { n: 0 };
    const loadSession = () =>
      fetch("/api/auth/session")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { user?: { firstName?: string; email?: string } | null; cartCount?: number | null; wishlistCount?: number | null }) => {
          if (!live) return;
          failuresRef.n = 0;
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
          /* network/502 → keep "pending" for the first miss; after the second
             straight miss fall back to anon so the slot isn't empty forever */
          if (!live) return;
          failuresRef.n += 1;
          if (failuresRef.n >= 2) setSession({ status: "anon" });
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

  // account menu: outside-click + Escape close, focus returns to the
  // trigger inside the wrapper that owned it. Registered BEFORE the drawer
  // effect so Escape with both open lands focus on the drawer toggle
  // (the drawer unmounts; its wrapper would too).
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t && !t.closest("[data-account]")) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target instanceof Element ? e.target : null;
      const wrapper = t?.closest("[data-account]") ?? null;
      setAccountOpen(false);
      wrapper?.querySelector<HTMLButtonElement>("button")?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // close both overlays when the route changes (render-phase adjust, not an effect)
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (menuOpen) setMenuOpen(false);
    if (accountOpen) setAccountOpen(false);
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
    setAccountOpen(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSession({ status: "anon" });
    setMenuOpen(false);
  };

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = q.trim();
    setQ("");
    setMenuOpen(false);
    router.push(term ? `/games?q=${encodeURIComponent(term)}` : "/games");
  };

  const cartCount = session.status === "in" ? session.cartCount : undefined;
  const wishlistCount = session.status === "in" ? session.wishlistCount : undefined;
  const onStore = pathname === "/games" || pathname.startsWith("/games/");

  // ONE auth control, three states — desktop gets the absolute menu,
  // the drawer gets it inline under the button (both never visible at once)
  const accountControl = (panelId: string, inline: boolean) => {
    if (session.status === "pending") {
      return inline ? null : <span aria-hidden="true" className="w-16" />;
    }
    if (session.status === "anon") {
      return (
        <Link
          href="/login"
          className={`${AUTH_BTN}${inline ? " w-full justify-center" : ""} bg-heading text-bg hover:bg-accent`}
        >
          Sign in
        </Link>
      );
    }
    return (
      <div data-account className={inline ? "w-full" : "relative"}>
        <button
          type="button"
          onClick={() => setAccountOpen((o) => !o)}
          aria-expanded={accountOpen}
          aria-haspopup="true"
          aria-controls={panelId}
          className={`${AUTH_BTN}${inline ? " w-full justify-between" : ""} border border-line bg-surface text-heading hover:border-accent`}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span className="max-w-28 truncate">{session.firstName || "Account"}</span>
          <CaretDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
          />
        </button>
        {accountOpen ? (
          <div
            id={panelId}
            className={`menu-in border border-line bg-surface shadow-xl ${
              inline ? "mt-3 w-full" : "absolute right-0 top-full mt-2 w-64"
            }`}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="font-display text-lg leading-none text-heading uppercase">
                {session.firstName || "Player"}
              </p>
              <p className="mt-1.5 truncate text-sm text-muted">{session.email ?? ""}</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/profile"
                onClick={() => setAccountOpen(false)}
                aria-current={pathname === "/profile" ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm tracking-[0.14em] uppercase transition-colors duration-200 hover:bg-bg/70 hover:text-accent ${
                  pathname === "/profile" ? "text-accent" : "text-text"
                }`}
              >
                <UserCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Profile
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm tracking-[0.14em] uppercase text-text transition-colors duration-200 hover:bg-bg/70 hover:text-accent"
              >
                <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-line backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-bg/95 shadow-lg" : "bg-bg/90"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl leading-none tracking-wide text-heading uppercase">
            GameHub
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex lg:gap-9">
          <NavLink href="/games" active={onStore}>
            Store
          </NavLink>
          <NavLink href="/#featured">Featured</NavLink>
          <NavLink href="/#genres">Genres</NavLink>
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <form role="search" onSubmit={onSearch} className="mr-2 hidden lg:block">
            <div className="relative">
              <label htmlFor={idSearch} className="sr-only">
                Search the store
              </label>
              <MagnifyingGlass
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              />
              <input
                id={idSearch}
                type="search"
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search games"
                className="h-10 w-44 border border-line bg-surface/60 pl-9 pr-3 text-sm text-text caret-accent outline-none transition-colors duration-200 placeholder:text-muted hover:border-white/20 xl:w-56"
              />
            </div>
          </form>
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
          {accountControl(idAccount, false)}
          {pathname === "/" ? (
            <Link href="/games" className="ml-2 hidden xl:block">
              <span
                className={`block bg-accent px-6 py-2.5 text-sm font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 ${SHEAR}`}
              >
                Browse the store
              </span>
            </Link>
          ) : null}
        </div>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center text-heading transition-colors duration-200 hover:text-accent lg:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
        </button>
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
          className="drawer-in fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-5 overflow-y-auto bg-bg/95 px-5 py-7 backdrop-blur-md lg:hidden"
        >
          <Link href="/games" className="font-display text-3xl leading-none text-heading uppercase transition-colors duration-200 hover:text-accent">
            Store
          </Link>
          <Link href="/#featured" className="font-display text-3xl leading-none text-heading uppercase transition-colors duration-200 hover:text-accent">
            Featured
          </Link>
          <Link href="/#genres" className="font-display text-3xl leading-none text-heading uppercase transition-colors duration-200 hover:text-accent">
            Genres
          </Link>

          <form role="search" onSubmit={onSearch} className="relative">
            <label htmlFor={idDrawerSearch} className="sr-only">
              Search the store
            </label>
            <MagnifyingGlass
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              id={idDrawerSearch}
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search games"
              className="h-11 w-full border border-line bg-surface/60 pl-9 pr-3 text-base text-text caret-accent outline-none transition-colors duration-200 placeholder:text-muted hover:border-white/20"
            />
          </form>

          <div className="flex items-center gap-3 border-t border-line pt-4 text-heading">
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

          <div className="border-t border-line pt-5">{accountControl(idDrawerAccount, true)}</div>

          {pathname === "/" ? (
            <Link href="/games" className="mt-auto block">
              <span
                className={`block bg-accent px-5 py-3 text-center text-sm font-semibold text-bg ${SHEAR}`}
              >
                Browse the store
              </span>
            </Link>
          ) : null}
        </div>,
        document.body,
      )}
    </header>
  );
}
