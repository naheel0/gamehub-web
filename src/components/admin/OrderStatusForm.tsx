"use client";

import { useActionState, useState } from "react";
import { ORDER_STATUSES } from "@/lib/admin/types";
import type { FormState } from "@/lib/admin/actions";

/**
 * Status transition for one order. Two-step armed confirm (AddressBook
 * vocabulary, onSubmit guard — never a type flip mid-click): first press
 * only arms, the second fires; the arm label always names the status being
 * confirmed. Deliberately not exercised live in this build: the production
 * DB holds zero orders, so there is nothing to transition without
 * fabricating rows — endpoint contract is AdminOrdersController's
 * PUT {orderId:guid}/status {status: "<Enum>"}.
 */
export default function OrderStatusForm({
  orderId,
  status,
  action,
}: {
  orderId: string;
  status: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [armed, setArmed] = useState(false);
  const [picked, setPicked] = useState(status);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!armed) {
            e.preventDefault();
            setArmed(true);
          }
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="id" value={orderId} />
        <div>
          <label
            htmlFor="o-status"
            className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase"
          >
            Order status
          </label>
          <select
            id="o-status"
            name="status"
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            className="mt-1.5 block h-11 border border-line bg-bg px-3 font-mono text-sm text-text focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-11 items-center border px-4 font-mono text-[11px] tracking-[0.12em] uppercase transition duration-200 disabled:opacity-50 active:scale-[0.98] ${
            armed
              ? "border-accent text-accent"
              : "border-line text-heading hover:border-accent hover:text-accent"
          }`}
        >
          {pending ? "Updating…" : armed ? `Confirm status: ${picked}` : "Update status"}
        </button>
        {armed && !pending && (
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="h-11 font-mono text-[11px] tracking-[0.12em] text-muted uppercase underline underline-offset-4 transition-colors duration-200 hover:text-accent active:text-accent"
          >
            Cancel
          </button>
        )}
      </form>
      {state?.err && (
        <p
          key={state.err}
          role="alert"
          className="deal-in max-w-xl border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text"
        >
          {state.err}
        </p>
      )}
    </div>
  );
}
