import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "@/components/ui/icons";
import ProductMedia from "@/components/game/ProductMedia";
import BuyBox from "@/components/game/BuyBox";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import { fetchAllGames, fetchGame } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

/** Prerender the live catalog's ids at build (cached list, one fetch);
 *  titles added later render on demand via dynamicParams. */
export async function generateStaticParams() {
  const games = await fetchAllGames();
  return games.map((g) => ({ id: String(g.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await fetchGame(Number(id)).catch(() => null);
  if (!game) return { title: "Not found — GameHub" };
  return {
    title: `${game.name} — GameHub`,
    description: game.description,
    openGraph: {
      images: game.imageUrls[0] ? [{ url: game.imageUrls[0] }] : [],
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) notFound();

  const game = await fetchGame(pid);
  if (!game) notFound();

  const all = await fetchAllGames();
  const related = all
    .filter((g) => g.id !== game.id)
    .sort(
      (a, b) =>
        (b.genre === game.genre ? 1 : 0) - (a.genre === game.genre ? 1 : 0) ||
        b.rating - a.rating,
    )
    .slice(0, 3);

  return (
    <>
      <Navbar />
      <main>
        <div className="mx-auto w-full max-w-7xl px-5 pt-28 pb-20 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the arena
          </Link>

          {/* e-com product grid: media gallery left, buy box right */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <ProductMedia
              name={game.name}
              imageUrls={game.imageUrls}
              trailerUrl={game.trailerUrl}
            />
            <BuyBox
              name={game.name}
              genre={game.genre}
              platform={game.platform}
              price={game.price}
              rating={game.rating}
              inStock={game.inStock}
              description={game.description}
            />
          </div>

        </div>

        {related.length > 0 && (
          <FeaturedGrid
            games={related}
            heading="More from the arena"
            eyebrow="Same shelf first, then the top ratings"
          />
        )}
      </main>
      <Footer />
    </>
  );
}
