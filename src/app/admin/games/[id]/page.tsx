import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { adminGet } from "@/lib/admin/fetch";
import type { Game } from "@/lib/types";
import { formatPrice } from "@/lib/format";

// adminGet reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "Edit game — Admin" };

const inputCls = "mt-1.5 h-10 w-full border border-line bg-bg px-3 font-mono text-sm text-text";

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
      <label htmlFor={htmlFor} className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

export default async function AdminGameEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const res = await adminGet<Game>(`/api/admin/games/${id}`);
  if (res.kind === "denied") redirect(`/login?next=/admin/games/${id}`);
  if (res.kind === "missing") notFound();
  if (res.kind === "unreachable") throw new Error("Couldn't load this game.");
  const game = res.data;
  const hasTrailer = /^https?:\/\//.test(game.trailerUrl);

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            Game #{game.id}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-[0.02em] text-heading uppercase sm:text-5xl">
            {game.name}
          </h1>
          <p className="mt-3 font-mono text-xs text-muted">
            {formatPrice(game.price)} · rating {game.rating} ·{" "}
            {game.inStock ? "in stock" : "out of stock"}
          </p>
        </div>
        <Link
          href="/admin/games"
          className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All games
        </Link>
      </div>

      {/* readOnly fields now; Save, uploads and delete wire up in Step 5 */}
      <form className="mt-6 space-y-6 border border-line bg-surface/60 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="g-name" label="Name" className="sm:col-span-2">
            <input id="g-name" name="name" defaultValue={game.name} readOnly className={inputCls} />
          </Field>
          <Field htmlFor="g-genre" label="Genre">
            <input id="g-genre" name="genre" defaultValue={game.genre} readOnly className={inputCls} />
          </Field>
          <Field htmlFor="g-platform" label="Platform">
            <input
              id="g-platform"
              name="platform"
              defaultValue={game.platform}
              readOnly
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
              defaultValue={game.price}
              readOnly
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
              defaultValue={game.rating}
              readOnly
              className={inputCls}
            />
          </Field>
          <div className="flex items-center gap-2.5 sm:col-span-2">
            <input
              id="g-stock"
              type="checkbox"
              checked={game.inStock}
              disabled
              className="h-4 w-4 accent-accent"
            />
            <label htmlFor="g-stock" className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              In stock
            </label>
          </div>
          <Field htmlFor="g-desc" label="Description" className="sm:col-span-2">
            <textarea
              id="g-desc"
              name="description"
              rows={5}
              defaultValue={game.description}
              readOnly
              className="mt-1.5 w-full border border-line bg-bg px-3 py-2 text-sm text-text"
            />
          </Field>
        </div>

        <section className="space-y-3 border-t border-line pt-5">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Images &amp; trailer
          </p>
          <div className="flex flex-wrap gap-3">
            {game.imageUrls.length === 0 ? (
              <span className="font-mono text-xs text-muted">No images.</span>
            ) : (
              game.imageUrls.map((url) => (
                <span key={url} className="block h-24 w-[4.5rem] overflow-hidden border border-line bg-bg">
                  <Image src={url} alt="" width={72} height={96} className="h-full w-full object-cover" />
                </span>
              ))
            )}
          </div>
          {hasTrailer && (
            <a
              href={game.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.1em] text-heading uppercase underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent"
            >
              Open trailer
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <button
            type="button"
            disabled
            className="h-11 cursor-not-allowed bg-accent px-6 font-display text-lg tracking-[0.04em] text-bg uppercase opacity-50"
          >
            Save changes
          </button>
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
            Saving, uploads and delete land in the next build step
          </p>
        </div>
      </form>
    </div>
  );
}
