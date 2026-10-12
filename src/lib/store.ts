/** Client-side calls to OUR relay routes — the browser never talks to the
 * backend directly (its API sends no CORS headers; server-side fetch only). */

export type StoreResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; status: number; message: string };

export async function storeCall<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<StoreResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: { message?: string } | null = null;
    try {
      parsed = text ? (JSON.parse(text) as { message?: string }) : null;
    } catch {
      /* non-JSON body — fall through to fallback copy */
    }
    if (!res.ok) {
      const fallback =
        res.status === 401 ? "Sign in to continue." : "We couldn't do that right now. Refresh and try again.";
      return { ok: false, status: res.status, message: parsed?.message ?? fallback };
    }
    return { ok: true, data: parsed as T, message: parsed?.message };
  } catch {
    return { ok: false, status: 0, message: "We couldn't reach the store right now. Refresh in a moment." };
  }
}

/** Badge counts live in the navbar — any cart/wishlist mutation announces here. */
export function announceCounts() {
  window.dispatchEvent(new Event("counts:changed"));
}
