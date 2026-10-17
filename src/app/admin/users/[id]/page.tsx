import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@/components/ui/icons";
import { adminGet } from "@/lib/admin/fetch";
import type { AdminUserDetailDto } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

// adminGet reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "User — Admin" };

const labelCls = "font-mono text-[10px] tracking-[0.16em] text-muted uppercase";

/**
 * Read-only account record. The backend also exposes four verbs here
 * (PUT block / PUT activate / PUT role, DELETE) — deliberately not wired
 * into this surface yet: blocking, demoting or deleting a real account is
 * a destructive admin verb gated on the site owner's call, and the UI must
 * additionally self-protect the signed-in admin from locking themselves
 * out. Reads only until that lands.
 */
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ids are ints on this route — a non-numeric id can never be a user, 404
  // locally, don't dial out
  if (!/^\d+$/.test(id)) notFound();

  const res = await adminGet<AdminUserDetailDto>(`/api/admin/AdminUsers/${id}`);
  if (res.kind === "denied") redirect(`/login?next=/admin/users/${id}`);
  if (res.kind === "missing") notFound();
  if (res.kind === "unreachable") throw new Error("Couldn't load this account.");
  const u = res.data;

  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">User #{u.id}</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-[0.02em] text-heading uppercase sm:text-5xl">
            {name}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
            <span className="border border-line px-2 py-0.5 text-[10px] tracking-[0.12em] text-heading uppercase">
              {u.role}
            </span>
            <span className="border border-line px-2 py-0.5 text-[10px] tracking-[0.12em] text-heading uppercase">
              {u.status}
            </span>
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent active:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All users
        </Link>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section aria-label="Account" className="border border-line bg-surface/60 p-5 sm:p-6">
          <p className={labelCls}>Account</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className={labelCls}>Email</dt>
              <dd className="mt-1 font-mono break-all text-heading">{u.email}</dd>
            </div>
            {u.phone && (
              <div>
                <dt className={labelCls}>Phone</dt>
                <dd className="mt-1 font-mono text-heading">{u.phone}</dd>
              </div>
            )}
          </dl>
        </section>

        <section aria-label="Activity" className="border border-line bg-surface/60 p-5 sm:p-6">
          <p className={labelCls}>Activity</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className={labelCls}>Orders</dt>
              <dd className="font-mono tabular-nums text-heading">{u.orderCount}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className={labelCls}>Saved addresses</dt>
              <dd className="font-mono tabular-nums text-heading">{u.addressCount}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
              <dt className={labelCls}>Total spent</dt>
              <dd className="font-mono text-lg tabular-nums text-accent">
                {formatPrice(u.totalSpent)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
