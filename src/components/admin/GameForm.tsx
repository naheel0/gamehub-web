"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import type { Game } from "@/lib/types";
import type { FormState } from "@/lib/admin/actions";

/** house field language — AuthForm's input styles, one app-wide */
const inputCls =
  "mt-1.5 h-12 w-full border border-line bg-bg px-4 font-mono text-sm tracking-[0.04em] text-heading transition-shadow duration-200 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none";

const labelCls = "font-mono text-[10px] tracking-[0.16em] text-muted uppercase";

type Fields = {
  name: string;
  genre: string;
  platform: string;
  price: string;
  rating: string;
  description: string;
  inStock: boolean;
};

function Field({
  htmlFor,
  label,
  children,
  className = "",
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Create/edit form as the client island it needs to be: success rides a PRG
 * redirect (refresh never reposts), failure returns one honest message via
 * useActionState. Fields are controlled because React resets a form to its
 * defaultValue after an action completes — observed live: a rejected submit
 * reverted typed values back to server state; held in React state, whatever
 * the admin typed survives the rejection. Existing art/trailer ride hidden
 * keep-fields — the backend treats ExistingImages as the keep-list and
 * replaces the rest. File inputs can't be controlled: a rejected submit
 * clears the file selection (reselect; rare enough to accept).
 */
export default function GameForm({
  game,
  action,
}: {
  game?: Game;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const editing = game !== undefined;
  const hasTrailer = !!game && /^https?:\/\//.test(game.trailerUrl);

  const [v, setV] = useState<Fields>(() => ({
    name: game?.name ?? "",
    genre: game?.genre ?? "",
    platform: game?.platform ?? "",
    price: game ? String(game.price) : "",
    rating: game ? String(game.rating) : "",
    description: game?.description ?? "",
    inStock: game ? game.inStock : true,
  }));

  // one handler for every field — each input's name attribute is the state key
  const upd = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    setV(
      prev =>
        ({
          ...prev,
          [t.name]: t.type === "checkbox" ? (t as HTMLInputElement).checked : t.value,
        }) as Fields,
    );
  };

  return (
    <form action={formAction} className="mt-6 space-y-6 border border-line bg-surface/60 p-5 sm:p-6">
      {state?.err && (
        <p key={state.err} role="alert" className="deal-in border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text">
          {state.err}
        </p>
      )}
      {game && <input type="hidden" name="id" value={game.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor="g-name" label="Name" className="sm:col-span-2">
          <input
            id="g-name"
            name="name"
            required
            value={v.name}
            onChange={upd}
            placeholder="Title"
            className={inputCls}
          />
        </Field>
        <Field htmlFor="g-genre" label="Genre">
          <input
            id="g-genre"
            name="genre"
            required
            value={v.genre}
            onChange={upd}
            placeholder="Action RPG"
            className={inputCls}
          />
        </Field>
        <Field htmlFor="g-platform" label="Platform">
          <input
            id="g-platform"
            name="platform"
            required
            value={v.platform}
            onChange={upd}
            placeholder="PC, PlayStation, Xbox"
            className={inputCls}
          />
        </Field>
        <Field htmlFor="g-price" label="Price (₹)">
          <input
            id="g-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={v.price}
            onChange={upd}
            className={inputCls}
          />
        </Field>
        <Field htmlFor="g-rating" label="Rating">
          <input
            id="g-rating"
            name="rating"
            type="number"
            step="0.1"
            min="0"
            required
            value={v.rating}
            onChange={upd}
            className={inputCls}
          />
        </Field>
        <div className="flex items-center gap-2.5 sm:col-span-2">
          <input
            id="g-stock"
            name="inStock"
            type="checkbox"
            value="true"
            checked={v.inStock}
            onChange={upd}
            className="h-4 w-4 accent-accent"
          />
          <label htmlFor="g-stock" className={labelCls}>
            In stock
          </label>
        </div>
        <Field htmlFor="g-desc" label="Description" className="sm:col-span-2">
          <textarea
            id="g-desc"
            name="description"
            rows={5}
            required
            value={v.description}
            onChange={upd}
            placeholder="What the store page should say"
            className="mt-1.5 w-full border border-line bg-bg px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_1px_var(--color-accent)] focus:outline-none"
          />
        </Field>
      </div>

      <section className="space-y-3 border-t border-line pt-5">
        <p className={labelCls}>Images &amp; trailer</p>
        {game?.imageUrls.map((url) => (
          <input key={url} type="hidden" name="existingImages" value={url} />
        ))}
        {hasTrailer && <input type="hidden" name="existingTrailer" value={game!.trailerUrl} />}
        {game && game.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {game.imageUrls.map((url) => (
              <span key={url} className="block h-24 w-[4.5rem] overflow-hidden border border-line bg-bg">
                <Image src={url} alt="" width={72} height={96} className="h-full w-full object-cover" />
              </span>
            ))}
          </div>
        )}
        {game && hasTrailer && (
          <a
            href={game.trailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.1em] text-heading uppercase underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent active:text-accent"
          >
            Open trailer
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
        <div>
          <label htmlFor="g-files" className={labelCls}>
            Add images
          </label>
          <input
            id="g-files"
            name="imageFiles"
            type="file"
            accept="image/*"
            multiple
            className="mt-1.5 block w-full font-mono text-[11px] text-muted file:mr-3 file:cursor-pointer file:border file:border-line file:bg-bg file:px-3 file:py-2 file:font-mono file:text-[11px] file:tracking-[0.12em] file:text-heading file:uppercase transition-colors hover:file:border-accent hover:file:text-accent"
          />
          <p className="mt-1.5 font-mono text-[10px] text-muted">
            New images are added alongside the existing art. Replacing or removing art
            isn&apos;t wired yet.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center bg-accent px-6 font-display text-lg tracking-[0.04em] text-bg uppercase transition duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create game"}
        </button>
        <Link
          href="/admin/games"
          className="font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent active:text-accent"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
