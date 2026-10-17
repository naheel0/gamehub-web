"use client";

import { useActionState, useState } from "react";
import { Trash } from "@/components/ui/icons";
import type { FormState } from "@/lib/admin/actions";

/**
 * Two-step armed delete, same shape as AddressBook's remove: the FIRST
 * press only arms (accent state), the second actually fires; Cancel disarms.
 * The arm check lives in onSubmit — not in a type flip: re-rendering the
 * button from type=button to type=submit during its own click activation
 * made the very first press submit the delete (observed: one-click
 * deletion through the activation-behavior path). Without JS the guard
 * never runs and the form posts once — acceptable, the admin surface
 * assumes JS like the rest of the client forms.
 */
export default function ArmDelete({
  id,
  action,
  label,
}: {
  id: number;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [armed, setArmed] = useState(false);

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
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-11 items-center gap-1.5 border px-3 font-mono text-[11px] tracking-[0.12em] uppercase transition duration-200 disabled:opacity-50 active:scale-[0.98] ${
            armed
              ? "border-accent text-accent"
              : "border-line text-muted hover:border-accent hover:text-accent"
          }`}
        >
          <Trash className="h-3.5 w-3.5" weight="bold" aria-hidden />
          {pending ? "Deleting…" : armed ? `Confirm delete ${label}` : "Delete"}
        </button>
        {armed && !pending && (
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase underline underline-offset-4 transition-colors duration-200 hover:text-accent active:text-accent"
          >
            Cancel
          </button>
        )}
      </form>
      {state?.err && (
        <p key={state.err} role="alert" className="deal-in max-w-xl border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text">
          {state.err}
        </p>
      )}
    </div>
  );
}
