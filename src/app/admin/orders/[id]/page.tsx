import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@/components/ui/icons";
import { adminGet } from "@/lib/admin/fetch";
import { GUID_RE, type AdminOrderDetailDto } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import Flash from "@/components/admin/Flash";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import { updateOrderStatus } from "@/lib/admin/actions";

// adminGet reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "Order — Admin" };

const labelCls = "font-mono text-[10px] tracking-[0.16em] text-muted uppercase";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ "status-updated"?: string }>;
}) {
  const { id } = await params;
  // malformed id can never be an order — 404 locally, don't dial out
  if (!GUID_RE.test(id)) notFound();
  const sp = await searchParams;

  const res = await adminGet<AdminOrderDetailDto>(`/api/admin/AdminOrders/${id}`);
  if (res.kind === "denied") redirect(`/login?next=/admin/orders/${id}`);
  if (res.kind === "missing") notFound();
  if (res.kind === "unreachable") throw new Error("Couldn't load this order.");
  const o = res.data;

  const when = new Date(o.orderDate).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const meta = [when, o.paymentMethod].filter(Boolean).join(" · ");
  const addr = o.shippingAddress;
  const cityLine = [addr.city, addr.state].filter(Boolean).join(", ");

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] break-all text-accent uppercase">
            Order #{o.orderId}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-[0.02em] text-heading uppercase sm:text-5xl">
            {o.customerName}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
            <span>{meta}</span>
            <span className="border border-line px-2 py-0.5 text-[10px] tracking-[0.12em] text-heading uppercase">
              {o.status}
            </span>
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent active:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
      </div>

      {sp["status-updated"] && (
        <div className="mt-6">
          <Flash msg="Status updated." />
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section aria-label="Customer" className="border border-line bg-surface/60 p-5 sm:p-6">
          <p className={labelCls}>Customer</p>
          <p className="mt-3 font-semibold text-heading">{o.customerName}</p>
          <p className="mt-1 font-mono text-sm break-all text-muted">{o.customerEmail}</p>
        </section>

        <section aria-label="Shipping address" className="border border-line bg-surface/60 p-5 sm:p-6">
          <p className={labelCls}>Shipping address</p>
          <div className="mt-3 text-sm text-text">
            <p className="font-semibold text-heading">{addr.fullName}</p>
            <p>{addr.addressLine1}</p>
            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
            <p>
              {cityLine}
              {addr.zipCode ? ` ${addr.zipCode}` : ""}
            </p>
            <p>{addr.country}</p>
            <p className="mt-1 font-mono text-xs text-muted">{addr.phone}</p>
          </div>
        </section>

        <section
          aria-label="Items and totals"
          className="border border-line bg-surface/60 p-5 sm:p-6 sm:col-span-2"
        >
          <p className={labelCls}>Items</p>
          {o.items.length === 0 ? (
            <p className="mt-3 font-mono text-xs text-muted">No line items on this order.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                    <th scope="col" className="py-2 pr-4 text-left font-normal">
                      Game
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-normal">
                      Qty
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-normal">
                      Unit
                    </th>
                    <th scope="col" className="py-2 text-right font-normal">
                      Line
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((it) => (
                    <tr key={it.gameId} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-4 font-semibold text-heading">{it.gameName}</td>
                      <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-text">
                        {it.quantity}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-muted">
                        {formatPrice(it.price)}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-text">
                        {formatPrice(it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-5 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-4">
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <dt className={labelCls}>Sub total</dt>
                <dd className="font-mono text-sm tabular-nums text-text">
                  {formatPrice(o.subTotal)}
                </dd>
              </div>
              <div className="flex items-baseline gap-4">
                <dt className={labelCls}>Tax</dt>
                <dd className="font-mono text-sm tabular-nums text-text">{formatPrice(o.tax)}</dd>
              </div>
            </div>
            <div className="flex items-baseline gap-4">
              <dt className={labelCls}>Total</dt>
              <dd className="font-mono text-xl tabular-nums text-accent">
                {formatPrice(o.total)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-label="Order status"
          className="border border-line bg-surface/60 p-5 sm:p-6 sm:col-span-2"
        >
          <p className={labelCls}>Fulfillment</p>
          <div className="mt-4">
            <OrderStatusForm orderId={o.orderId} status={o.status} action={updateOrderStatus} />
          </div>
        </section>
      </div>
    </div>
  );
}
