import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@/components/ui/icons";
import { adminGet } from "@/lib/admin/fetch";
import type { Game } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import GameForm from "@/components/admin/GameForm";
import ArmDelete from "@/components/admin/ArmDelete";
import Flash from "@/components/admin/Flash";
import { saveGame, deleteGame } from "@/lib/admin/actions";

// adminGet reads cookies per request — never prerendered
export const instant = false;

export const metadata: Metadata = { title: "Edit game — Admin" };

export default async function AdminGameEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const sp = await searchParams;

  const res = await adminGet<Game>(`/api/admin/games/${id}`);
  if (res.kind === "denied") redirect(`/login?next=/admin/games/${id}`);
  if (res.kind === "missing") notFound();
  if (res.kind === "unreachable") throw new Error("Couldn't load this game.");
  const game = res.data;

  const flash = sp.created ? "Game created." : sp.saved ? "Changes saved." : undefined;

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
          className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent active:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All games
        </Link>
      </div>

      {flash && (
        <div className="mt-6">
          <Flash msg={flash} />
        </div>
      )}

      <GameForm game={game} action={saveGame} />

      <section className="mt-8 border border-line bg-surface/60 p-5 sm:p-6">
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          Remove from catalog
        </p>
        <p className="mt-2 max-w-xl font-mono text-xs text-muted">
          Deletes {game.name} from the store for everyone. The button asks for confirmation first,
          and the removal can&apos;t be undone.
        </p>
        <div className="mt-4">
          <ArmDelete id={game.id} action={deleteGame} label={game.name} />
        </div>
      </section>
    </div>
  );
}
