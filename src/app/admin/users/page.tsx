import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import { adminUsersPage } from "@/lib/admin/fetch";
import { ACCOUNT_STATUSES, ROLES, type AdminUserListDto } from "@/lib/admin/types";

// adminUsersPage reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "Users — Admin" };

const PAGE_SIZE = 15;
const SORT_COLS = ["name", "email", "role", "status", "createdat"] as const;
type SortCol = (typeof SORT_COLS)[number];
type Dir = "asc" | "desc";

type Search = {
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
  status?: string;
  role?: string;
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

const joinedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort: SortCol = SORT_COLS.includes(sp.sort as SortCol) ? (sp.sort as SortCol) : "createdat";
  const dir: Dir = sp.dir === "asc" ? "asc" : "desc"; // newest-first default
  const pageRaw = Number(sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const status = (ACCOUNT_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as string)
    : "";
  const role = (ROLES as readonly string[]).includes(sp.role ?? "") ? (sp.role as string) : "";

  // all state lives in the URL; defaults stay out of it
  const paramsFor = (opts?: {
    q?: string;
    sort?: SortCol;
    dir?: Dir;
    page?: number;
    status?: string;
    role?: string;
  }) => {
    const p = new URLSearchParams();
    const qq = opts?.q ?? q;
    const ss = opts?.sort ?? sort;
    const dd = opts?.dir ?? dir;
    const st = opts?.status ?? status;
    const rr = opts?.role ?? role;
    if (qq) p.set("q", qq);
    if (st) p.set("status", st);
    if (rr) p.set("role", rr);
    if (ss !== "createdat" || dd !== "desc") p.set("sort", ss);
    if (dd !== "desc") p.set("dir", dd);
    if (opts?.page && opts.page > 1) p.set("page", String(opts.page));
    const s = p.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  };

  const res = await adminUsersPage({
    page,
    limit: PAGE_SIZE,
    search: q || undefined,
    sort,
    order: dir,
    status: status || undefined,
    role: role || undefined,
  });
  if (res.kind === "denied") redirect("/login?next=/admin/users");
  if (res.kind === "missing") throw new Error("Users list rejected the query.");
  if (res.kind === "unreachable") throw new Error("Couldn't load the users table.");
  const { items, totalCount } = res.data;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // out-of-range page (honest API: empty items + real totalCount) → page 1
  // of the same filtered query, not a bare reset
  if (items.length === 0 && page > 1 && totalCount > 0) redirect(paramsFor({ page: 1 }));

  const filtered = !!q || !!status || !!role;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">Accounts</p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-[0.02em] text-heading uppercase sm:text-6xl">
            Users
          </h1>
        </div>
        <form method="get" role="search" className="flex flex-wrap items-center gap-2">
          <label htmlFor="users-q" className="sr-only">
            Search users
          </label>
          {/* key-remount: defaultValue alone doesn't rewrite the DOM value on
              a client-side navigation (Clear via Link) — same trick Flash uses */}
          <input
            id="users-q"
            type="search"
            name="q"
            key={q}
            defaultValue={q}
            placeholder="Name or email…"
            className="h-11 w-48 border border-line bg-bg px-3 font-mono text-sm text-text placeholder:text-muted"
          />
          <label htmlFor="users-role" className="sr-only">
            Filter by role
          </label>
          <select
            id="users-role"
            name="role"
            key={role}
            defaultValue={role}
            className="h-11 border border-line bg-bg px-3 font-mono text-sm text-text"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <label htmlFor="users-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="users-status"
            name="status"
            key={status}
            defaultValue={status}
            className="h-11 border border-line bg-bg px-3 font-mono text-sm text-text"
          >
            <option value="">All statuses</option>
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 shrink-0 border border-line px-4 font-mono text-xs tracking-[0.14em] text-heading uppercase transition duration-200 hover:border-accent hover:text-accent active:scale-[0.98]"
          >
            Search
          </button>
          {filtered && (
            <Link
              href={paramsFor({ q: "", status: "", role: "" })}
              className="font-mono text-xs text-muted underline underline-offset-4 transition-colors duration-200 hover:text-accent active:text-accent"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <p aria-live="polite" className="mt-4 font-mono text-xs text-muted">
        {totalCount} {totalCount === 1 ? "user" : "users"}
        {q ? ` matching “${q}”` : ""}
        {role ? ` · ${role}` : ""}
        {status ? ` · ${status}` : ""}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 border border-line bg-surface/60 p-8 text-center">
          <p className="font-display text-2xl text-heading uppercase">
            {filtered ? "No users match" : "No users yet"}
            {q ? ` “${q}”` : ""}
            {role ? ` · ${role}` : ""}
            {status ? ` · ${status}` : ""}
          </p>
          {filtered && (
            <Link
              href="/admin/users"
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
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  <SortTh
                    col="name"
                    label="User"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="role"
                    label="Role"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="status"
                    label="Status"
                    sort={sort}
                    dir={dir}
                    hrefFor={(c, d) => paramsFor({ sort: c, dir: d })}
                  />
                  <SortTh
                    col="createdat"
                    label="Joined"
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
                {items.map((u: AdminUserListDto) => (
                  <tr
                    key={u.id}
                    className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-bg/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-heading">{u.fullName || u.email}</div>
                      <div className="font-mono text-[11px] break-all text-muted">{u.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="border border-line px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-heading uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="border border-line px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-heading uppercase">
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-muted">
                      {joinedDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
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
