import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import { adminOrdersPage } from "@/lib/admin/fetch";
import { ORDER_STATUSES, type AdminOrderListDto } from "@/lib/admin/types";
import { shortDate } from "@/lib/format";
import { formatPrice } from "@/lib/format";

// adminOrdersPage reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "Orders — Admin" };

const PAGE_SIZE = 15;
const SORT_COLS = ["customer", "orderdate", "total", "status"] as const;
type SortCol = (typeof SORT_COLS)[number];
type Dir = "asc" | "desc";

type Search = {
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
  status?: string;
};

/** Sortable header: real link, URL carries sort+dir, page resets (aria-sort
 *  announces direction — the glyph is decoration, never the only signal). */
function SortTh({
  col,
  label,
  sort,
  dir,
  hrefFor,
  align = "left",
}: {
  col: SortCol;
  label: string;
  sort: SortCol;
  dir: Dir;
  hrefFor: (col: SortCol, dir: Dir) => string;
  align?: "left" | "right";
}) {
  const active = sort === col;
  const nextDir: Dir = active && dir === "asc" ? "desc" : "asc";
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 font-normal ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Link
        href={hrefFor(col, nextDir)}
        className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-accent active:text-accent"
      >
        {label}
        {active && (
          <span aria-hidden="true" className="text-accent">
            {dir === "asc" ? "▲" : "▼"}
          </span>
        )}
      </Link>
    </th>
  );
}

const shortGuid = (id: string) => `${id.slice(0, 8)}…`;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort: SortCol = SORT_COLS.includes(sp.sort as SortCol) ? (sp.sort as SortCol) : "orderdate";
  const dir: Dir = sp.dir === "asc" ? "asc" : "desc"; // newest-first default
  const pageRaw = Number(sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "";

  // all state lives in the URL; defaults stay out of it
  const paramsFor = (opts?: {
    q?: string;
    sort?: SortCol;
    dir?: Dir;
    page?: number;
    status?: string;
  }) => {
    const p = new URLSearchParams();
    const qq = opts?.q ?? q;
    const ss = opts?.sort ?? sort;
    const dd = opts?.dir ?? dir;
    const st = opts?.status ?? status;
    if (qq) p.set("q", qq);
    if (st) p.set("status", st);
    if (ss !== "orderdate" || dd !== "desc") p.set("sort", ss);
    if (dd !== "desc") p.set("dir", dd);
    if (opts?.page && opts.page > 1) p.set("page", String(opts.page));
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  const res = await adminOrdersPage({
    page,
    limit: PAGE_SIZE,
    search: q || undefined,
    sort,
    order: dir,
    status: status || undefined,
  });
  if (res.kind === "denied") redirect("/login?next=/admin/orders");
  if (res.kind === "missing") throw new Error("Orders list rejected the query.");
  if (res.kind === "unreachable") throw new Error("Couldn't load the orders table.");
  const { items, totalCount } = res.data;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // out-of-range page (honest API: empty items + real totalCount) → page 1
  // of the same filtered query, not a bare reset
  if (items.length === 0 && page > 1 && totalCount > 0) redirect(paramsFor({ page: 1 }));

  const filtered = !!q || !!status;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            Fulfillment
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-[0.02em] text-heading uppercase sm:text-6xl">
            Orders
          </h1>
        </div>
        <form method="get" role="search" className="flex flex-wrap items-center gap-2">
          <label htmlFor="orders-q" className="sr-only">
            Search orders
          </label>
          {/* key-remount: defaultValue alone doesn't rewrite the DOM value on
              a client-side navigation (Clear via Link) — same trick Flash uses */}
          <input
            id="orders-q"
            type="search"
            name="q"
            key={q}
            defaultValue={q}
            placeholder="Name, email or order id…"
            className="h-11 w-52 border border-line bg-bg px-3 font-mono text-sm text-text placeholder:text-muted"
          />
          <label htmlFor="orders-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="orders-status"
            name="status"
            key={status}
            defaultValue={status}
            className="h-11 border border-line bg-bg px-3 font-mono text-sm text-text"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {/* sort/dir don't ride the GET inputs — carry non-default sort state
              across a search submit so results don't silently reorder */}
          {sort !== "orderdate" && <input type="hidden" name="sort" value={sort} />}
          {dir !== "desc" && <input type="hidden" name="dir" value={dir} />}
          <button
            type="submit"
            className="h-11 shrink-0 border border-line px-4 font-mono text-xs tracking-[0.14em] text-heading uppercase transition duration-200 hover:border-accent hover:text-accent active:scale-[0.98]"
          >
            Search
          </button>
          {filtered && (
            <Link
              href={paramsFor({ q: "", status: "" })}
              className="font-mono text-xs text-muted underline underline-offset-4 transition-colors duration-200 hover:text-accent active:text-accent"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <p aria-live="polite" className="mt-4 font-mono text-xs text-muted">
        {totalCount} {totalCount === 1 ? "order" : "orders"}
        {q ? ` matching “${q}”` : ""}
        {status ? ` · ${status}` : ""}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 border border-line bg-surface/60 p-8 text-center">
          <p className="font-display text-2xl text-heading uppercase">
            {filtered
              ? "No orders match"
              : "No orders yet"}
            {q ? ` “${q}”` : ""}
            {status ? ` · ${status}` : ""}
          </p>
          {filtered && (
            <Link
              href="/admin/orders"
              className="mt-5 inline-flex h-11 items-center border border-line px-5 font-mono text-xs tracking-[0.14em] text-heading uppercase transition duration-200 hover:border-accent hover:text-accent active:scale-[0.98]"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* contain-paint: keeps this table's width off the document scroll
              area — same 390px root-swipe leak the games table had */}
          <div className="mt-6 overflow-x-auto contain-paint border border-line bg-surface/60">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  <th scope="col" className="px-4 py-3 text-left font-normal">
                    Order
                  </th>
                  <SortTh
                    col="customer"
                    label="Customer"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="orderdate"
                    label="Date"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="total"
                    label="Total"
                    sort={sort}
                    dir={dir}
                    align="right"
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="status"
                    label="Status"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <th scope="col" className="px-4 py-3 text-right font-normal">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((o: AdminOrderListDto) => (
                  <tr
                    key={o.orderId}
                    className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-bg/50"
                  >
                    <td className="px-4 py-2.5">
                      <span
                        title={o.orderId}
                        className="font-mono text-xs tracking-[0.06em] text-heading"
                      >
                        {shortGuid(o.orderId)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-heading">{o.customerName}</div>
                      <div className="font-mono text-[11px] break-all text-muted">
                        {o.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-muted">
                      {shortDate(o.orderDate)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-accent">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="border border-line px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-heading uppercase">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/admin/orders/${o.orderId}`}
                        className="font-mono text-xs tracking-[0.1em] text-heading uppercase underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent active:text-accent"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CatalogPagination page={page} totalPages={totalPages} hrefFor={(p) => paramsFor({ page: p })} />
        </>
      )}
    </div>
  );
}
