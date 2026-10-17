import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/ui/icons";
import GameForm from "@/components/admin/GameForm";
import { createGame } from "@/lib/admin/actions";

export const metadata: Metadata = { title: "New game — Admin" };

export default function NewGamePage() {
  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            Catalog control
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-[0.02em] text-heading uppercase sm:text-5xl">
            Create game
          </h1>
        </div>
        <Link
          href="/admin/games"
          className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent active:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All games
        </Link>
      </div>

      <GameForm action={createGame} />
    </div>
  );
}
