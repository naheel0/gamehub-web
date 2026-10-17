"use client";

import { useActionState, useState } from "react";
import {
  activateUser,
  blockUser,
  deleteUser,
  updateUserRole,
} from "@/lib/admin/actions";
import { ROLES } from "@/lib/admin/types";
import ArmDelete from "./ArmDelete";

const labelCls = "font-mono text-[10px] tracking-[0.16em] text-muted uppercase";

/**
 * Account control for one customer record. Administrators are never wired
 * into this component — the page renders a protection note instead, mirroring
 * the backend guard in AdminService (block/role/delete refuse any Admin
 * target, so the signed-in admin can't lock themselves out either).
 * Block is a two-step armed confirm (AddressBook vocabulary, onSubmit guard —
 * never a type flip mid-click); Activate is a single press, reversible and a
 * no-op on an already-active account; the role change arms exactly like
 * OrderStatusForm; delete rides ArmDelete and says plainly there is no
 * un-delete.
 */
export default function UserControls({
  id,
  status,
  role,
  name,
}: {
  id: number;
  status: string;
  role: string;
  name: string;
}) {
  return (
    <div className="space-y-8">
      {status === "Blocked" ? <ActivateForm id={id} /> : <BlockForm id={id} name={name} />}
      <RoleForm id={id} role={role} />
      <div>
        <p className={labelCls}>Delete account</p>
        <div className="mt-3">
          <ArmDelete id={id} action={deleteUser} label={name} />
        </div>
        <p className="mt-3 max-w-xl font-mono text-[11px] text-muted">
          There is no un-delete — the record is removed for good.
        </p>
      </div>
    </div>
  );
}

function BlockForm({ id, name }: { id: number; name: string }) {
  const [state, formAction, pending] = useActionState(blockUser, null);
  const [armed, setArmed] = useState(false);
  return (
    <div className="space-y-3">
      <p className={labelCls}>Account status</p>
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
          className={`inline-flex h-11 items-center border px-4 font-mono text-[11px] tracking-[0.12em] uppercase transition duration-200 disabled:opacity-50 active:scale-[0.98] ${
            armed
              ? "border-accent text-accent"
              : "border-line text-heading hover:border-accent hover:text-accent"
          }`}
        >
          {pending ? "Blocking…" : armed ? `Confirm block ${name}` : "Block user"}
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
      <p className="max-w-xl font-mono text-[11px] text-muted">
        Blocking signs this account out and refuses further sign-ins.
      </p>
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

function ActivateForm({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(activateUser, null);
  return (
    <div className="space-y-3">
      <p className={labelCls}>Account status</p>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center border border-line px-4 font-mono text-[11px] tracking-[0.12em] text-heading uppercase transition duration-200 hover:border-accent hover:text-accent disabled:opacity-50 active:scale-[0.98]"
        >
          {pending ? "Activating…" : "Activate user"}
        </button>
        <p className="font-mono text-[11px] text-muted">Reopens sign-in for this account.</p>
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

function RoleForm({ id, role }: { id: number; role: string }) {
  const [state, formAction, pending] = useActionState(updateUserRole, null);
  const [armed, setArmed] = useState(false);
  const [picked, setPicked] = useState(role);
  return (
    <div className="space-y-3">
      <p className={labelCls}>Role</p>
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
        <input type="hidden" name="id" value={id} />
        <div>
          <label htmlFor={`u-role-${id}`} className="sr-only">
            Role
          </label>
          <select
            id={`u-role-${id}`}
            name="role"
            value={picked}
            onChange={(e) => {
              setPicked(e.target.value);
              setArmed(false);
            }}
            className="block h-11 border border-line bg-bg px-3 font-mono text-sm text-text focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
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
          {pending ? "Updating…" : armed ? `Confirm role: ${picked}` : "Update role"}
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
