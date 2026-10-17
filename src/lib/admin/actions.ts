"use server";

import { redirect } from "next/navigation";
import { relay } from "@/lib/auth";
import { adminGet } from "@/lib/admin/fetch";
import { ADMIN_ROLE } from "@/lib/admin/session";
import { GUID_RE, ORDER_STATUSES, ROLES, type AdminUserDetailDto } from "@/lib/admin/types";

/** useActionState returns null (clean) or one honest failure message. */
export type FormState = { err: string } | null;

const OFFLINE = "We couldn't reach the store right now. Try again in a moment.";

/**
 * Failure copy from one backend response: relay's own messages and field
 * validation pass through verbatim; the image-upload 502 answers with a raw
 * exception dump in `message`, so only its `error` label is shown; 5xx with
 * nothing usable falls back to the offline line instead of inventing detail.
 */
async function failure(res: Response): Promise<string> {
  if (res.status === 401) return "Your session has expired. Sign in again.";
  if (res.status === 403) return "Your account can't change the catalog.";
  let body: {
    message?: string;
    error?: string;
    detail?: string;
    errors?: Record<string, string | string[]>;
  } | null = null;
  try {
    body = await res.json();
  } catch {
    /* handled by the fallbacks below */
  }
  if ((res.status === 400 || res.status === 422) && body?.errors) {
    const first = Object.values(body.errors).flat()[0];
    if (first) return String(first);
  }
  if (res.status >= 500) return body?.error ? `${body.error}.` : body?.message ?? OFFLINE;
  return body?.message || body?.detail || body?.error || "Something went wrong. Check the form and try again.";
}

/**
 * Every mutation is relayed to endpoints the API guards itself with
 * [Authorize(Roles="Admin")] — an untrusted POST can relay, never bypass,
 * that check; these handlers only decide where the caller lands afterwards.
 * 401 after relay's own refresh attempt = genuinely dead session → login;
 * 403 = not an admin → the /admin gate decides honestly.
 */
export async function createGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const res = await relay("POST", "/api/admin/games", formData);
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent("/admin/games/new")}`);
  if (res.status === 403) redirect("/admin");
  if (!res.ok) return { err: await failure(res) };

  let id: number | null = null;
  try {
    const game = (await res.json()) as { id?: number };
    id = typeof game?.id === "number" ? game.id : null;
  } catch {
    /* created but the body didn't parse — the table still proves it */
  }
  redirect(id ? `/admin/games/${id}?created=1` : "/admin/games?created=1");
}

export async function saveGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { err: "That game no longer exists." };

  const res = await relay("PUT", `/api/admin/games/${id}`, formData);
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/admin/games/${id}`)}`);
  if (res.status === 403) redirect("/admin");
  if (!res.ok) return { err: await failure(res) };
  redirect(`/admin/games/${id}?saved=1`);
}

export async function deleteGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { err: "That game no longer exists." };

  const res = await relay("DELETE", `/api/admin/games/${id}`);
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/admin/games/${id}`)}`);
  if (res.status === 403) redirect("/admin");
  if (res.status === 404) return { err: "That game no longer exists." };
  if (!res.ok) return { err: await failure(res) };
  redirect("/admin/games?deleted=1");
}

/** Status transition — the one order verb this build ships (the backend's
 *  DELETE api/admin/AdminOrders/{id} exists but is deliberately not
 *  surfaced: an operational order should be cancelled by status, never
 *  erased). Value is allowlisted against the backend enum before the
 *  request leaves. Route token: AdminOrdersController routes
 *  api/admin/[controller] — "AdminOrders", not "orders". */
export async function updateOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!GUID_RE.test(id)) return { err: "That order no longer exists." };
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { err: "Pick a valid status." };
  }

  const res = await relay("PUT", `/api/admin/AdminOrders/${id}/status`, { status });
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/admin/orders/${id}`)}`);
  if (res.status === 403) redirect("/admin");
  if (res.status === 404) return { err: "That order no longer exists." };
  if (!res.ok) return { err: await failure(res) };
  redirect(`/admin/orders/${id}?status-updated=1`);
}

/**
 * User verbs. Self-protection is enforced twice: the backend guard
 * (AdminService — block/role/delete refuse any Administrator account; that
 * is the authorization) and this frontend re-check, which loads the
 * target's role first so an honest refusal stands even before the next
 * backend deploy. Activate stays unguarded on both sides — reversible,
 * and a no-op on an already-active admin.
 */
async function adminTargetGuard(id: number): Promise<string | null> {
  const got = await adminGet<AdminUserDetailDto>(`/api/admin/AdminUsers/${id}`);
  if (got.kind === "unreachable") return OFFLINE;
  if (got.kind === "missing") return "That user no longer exists.";
  // denied = expired/forbidden read; let the verb itself surface 401/403
  if (got.kind !== "ok") return null;
  return got.data.role === ADMIN_ROLE ? "Administrator accounts can't be changed here." : null;
}

export async function blockUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { err: "That user no longer exists." };
  const guard = await adminTargetGuard(id);
  if (guard) return { err: guard };

  const res = await relay("PUT", `/api/admin/AdminUsers/${id}/block`, {});
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/admin/users/${id}`)}`);
  if (res.status === 403) redirect("/admin");
  if (res.status === 404) return { err: "That user no longer exists." };
  if (!res.ok) return { err: await failure(res) };
  redirect(`/admin/users/${id}?blocked=1`);
}

export async function activateUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { err: "That user no longer exists." };

  const res = await relay("PUT", `/api/admin/AdminUsers/${id}/activate`, {});
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/admin/users/${id}`)}`);
  if (res.status === 403) redirect("/admin");
  if (res.status === 404) return { err: "That user no longer exists." };
  if (!res.ok) return { err: await failure(res) };
  redirect(`/admin/users/${id}?activated=1`);
}

export async function updateUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "");
  if (!Number.isInteger(id) || id <= 0) return { err: "That user no longer exists." };
  if (!(ROLES as readonly string[]).includes(role)) return { err: "Pick a valid role." };
  const guard = await adminTargetGuard(id);
  if (guard) return { err: guard };

  const res = await relay("PUT", `/api/admin/AdminUsers/${id}/role`, { role });
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/admin/users/${id}`)}`);
  if (res.status === 403) redirect("/admin");
  if (res.status === 404) return { err: "That user no longer exists." };
  if (!res.ok) return { err: await failure(res) };
  redirect(`/admin/users/${id}?role-updated=1`);
}

export async function deleteUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { err: "That user no longer exists." };
  const guard = await adminTargetGuard(id);
  if (guard) return { err: guard };

  const res = await relay("DELETE", `/api/admin/AdminUsers/${id}`);
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent("/admin/users")}`);
  if (res.status === 403) redirect("/admin");
  if (res.status === 404) return { err: "That user no longer exists." };
  if (!res.ok) return { err: await failure(res) };
  redirect("/admin/users?deleted=1");
}
