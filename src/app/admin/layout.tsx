import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/session";

// allowed to block: the gate reads cookies() per request — an admin shell
// must never ship a static shell that flashes before the role check
export const instant = false;

export const metadata: Metadata = {
  title: "Admin — GameHub",
  // a tool, never a landing page — robots.ts and sitemap agree
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const gate = await requireAdmin();
  if (gate.kind === "denied") redirect("/login?next=/admin");
  if (gate.kind === "unreachable") {
    // backend down: the honest error page, never a false sign-out
    throw new Error("Couldn't reach GameHub to verify the admin session.");
  }
  const { user } = gate;

  return (
    <div className="min-h-dvh">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:tracking-[0.14em] focus:text-bg focus:uppercase"
      >
        Skip to content
      </a>

      {/* desktop rail — translucent chrome, Crimson Arena tokens */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-bg/75 backdrop-blur-xl lg:flex">
        <div className="border-b border-line px-5 py-5">
          <p className="font-display text-2xl leading-none tracking-[0.08em] text-heading uppercase">
            GameHub
          </p>
          <p className="mt-1.5 font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            Admin
          </p>
        </div>
        <nav className="flex-1 px-3 py-4">
          <AdminNav />
        </nav>
        <div className="border-t border-line px-5 py-4">
          <p className="truncate font-mono text-[11px] text-muted" title={user.email}>
            {user.email}
          </p>
          <span className="mt-2 inline-flex bg-accent px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] text-bg uppercase">
            {user.role}
          </span>
        </div>
      </aside>

      {/* mobile/compact top bar — same sticky chrome; the section nav joins
          inline so a tablet in the 641–1023px band still has every link */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl leading-none tracking-[0.08em] text-heading uppercase">
            GameHub <span className="text-accent">Admin</span>
          </span>
          <span className="inline-flex bg-accent px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] text-bg uppercase">
            {user.role}
          </span>
        </div>
        <AdminNav orientation="horizontal" />
      </header>

      {/* tabindex -1: the skip link moves focus here, so Tab continues past the
          rail. Inline outline suppression — the unlayered :focus-visible rule in
          globals beats the utility class, and a ring on this giant block only
          reads as a stray bottom edge; links inside keep their rings. */}
      <main
        id="admin-main"
        tabIndex={-1}
        style={{ outline: "none" }}
        className="lg:pl-64"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
