import { notFound, redirect } from "next/navigation";
import CountUp from "@/components/ui/CountUp";
import MoneyCount from "@/components/admin/MoneyCount";
import { adminGet } from "@/lib/admin/fetch";
import { ORDER_STATUSES, type DashboardStatsDto, type OrderStatusCount } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

// same opt-out as the layout: reads cookies() per request
export const instant = false;

/** Big Shoulders on h2 is the global rule (unlayered beats utilities) —
 *  section headers ride it; mono labels live on <p> elements. */

function StatTile({ label, value, money }: { label: string; value: number; money?: boolean }) {
  return (
    <div className="border border-line bg-surface/60 p-4 sm:p-5">
      <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">{label}</p>
      <p
        className={`mt-3 font-mono text-3xl leading-none tabular-nums ${
          money ? "text-accent" : "text-heading"
        }`}
      >
        {money ? <MoneyCount value={value} /> : <CountUp value={value} />}
      </p>
    </div>
  );
}

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  // local-constructed date: ISO calendar day, no UTC → IST shift
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function SalesBars({ sales }: { sales: DashboardStatsDto["last7DaysSales"] }) {
  // the API lists only days that had sales — the axis is always the real last
  // 7 UTC calendar days (the same day-boundary the backend groups by), so an
  // absent day renders as an honest ₹0 slot, never a fabricated amount
  const byDate = new Map(sales.map((s) => [s.date.slice(0, 10), s.amount]));
  // eslint-disable-next-line react-hooks/purity -- server component: this renders per request and is never hydrated, so a per-request clock read is safe
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    return { date: iso, amount: byDate.get(iso) ?? 0 };
  });
  const max = Math.max(...days.map((d) => d.amount), 0);
  return (
    <div>
      <div className="flex h-40 items-end gap-2 border-b border-line pb-px sm:gap-3">
        {days.map((d) => (
          <div
            key={d.date}
            className="flex h-full flex-1 items-end"
            title={`${dayLabel(d.date)}: ${formatPrice(d.amount)}`}
          >
            <div
              aria-hidden="true"
              className={`w-full transition-colors duration-200 ${
                d.amount === max ? "bg-accent" : "bg-accent/30 hover:bg-accent/60"
              }`}
              style={{ height: `${max ? Math.max((d.amount / max) * 100, d.amount > 0 ? 4 : 0) : 0}%` }}
            />
            <span className="sr-only">
              {dayLabel(d.date)}: {formatPrice(d.amount)}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-2 sm:gap-3">
        {days.map((d) => (
          <span key={d.date} className="flex-1 text-center font-mono text-[10px] text-muted uppercase">
            {dayLabel(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusBars({ rows }: { rows: OrderStatusCount[] }) {
  // the 7-value enum is the full domain — a status with no orders is a row
  // at 0, not a hidden one, even when the distribution is partial
  const byStatus = new Map(rows.map((r) => [r.status, r.count]));
  const list: OrderStatusCount[] = ORDER_STATUSES.map((s) => ({
    status: s,
    count: byStatus.get(s) ?? 0,
  }));
  const max = Math.max(...list.map((r) => r.count), 1);
  return (
    <ul className="space-y-2.5">
      {list.map((r) => (
        <li key={r.status} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
            {r.status}
          </span>
          <span className="block h-2 flex-1 border border-line bg-bg/70">
            <span
              aria-hidden="true"
              className="block h-full bg-accent/50"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-heading">
            {r.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminDashboardPage() {
  const res = await adminGet<DashboardStatsDto>("/api/Admin/dashboard");
  if (res.kind === "denied") redirect("/login?next=/admin");
  if (res.kind === "missing") notFound(); // impossible for this route — kept for exhaustiveness
  if (res.kind === "unreachable") {
    throw new Error("Couldn't reach the GameHub dashboard.");
  }
  const stats = res.data;
  const salesTotal = stats.last7DaysSales.reduce((n, x) => n + x.amount, 0);
  // no sort: StatusBars renders the full ORDER_STATUSES enum in domain order,
  // so a count-ordering here was dead work
  const byStatus = stats.orderStatusDistribution;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl leading-none tracking-[0.02em] text-heading uppercase sm:text-6xl">
        Dashboard
      </h1>

      <section aria-label="Store totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Products" value={stats.totalProducts} />
        <StatTile label="Users" value={stats.totalUsers} />
        <StatTile label="Orders" value={stats.totalOrders} />
        <StatTile label="Revenue" value={stats.totalRevenue} money />
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section
          aria-label="Sales, last 7 days"
          className="border border-line bg-surface/60 p-4 sm:p-5"
        >
          <header className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-xl leading-none tracking-[0.06em] uppercase">Sales — last 7 days</h2>
            <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
              <MoneyCount value={salesTotal} /> total
            </p>
          </header>
          <SalesBars sales={stats.last7DaysSales} />
        </section>

        <section aria-label="Orders by status" className="border border-line bg-surface/60 p-4 sm:p-5">
          <header className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-xl leading-none tracking-[0.06em] uppercase">Orders by status</h2>
            <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
              <CountUp value={stats.totalOrders} /> total
            </p>
          </header>
          <StatusBars rows={byStatus} />
        </section>
      </div>
    </div>
  );
}
