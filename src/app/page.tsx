import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import GenreRail from "@/components/home/GenreRail";
import CtaBand from "@/components/home/CtaBand";
import { fetchAllGames } from "@/lib/api";

// Store flow: live-catalog hero -> title ticker -> top-rated cards ->
// genre counts -> pick-your-game CTA. Every number on the page comes
// from the API; zero invented content.
export default async function Home() {
  // down = null → degrade to empty sections (the landing never hard-errors)
  const all = (await fetchAllGames()) ?? [];

  const byRating = [...all].sort((a, b) => b.rating - a.rating);
  const heroGames = byRating
    .filter((g) => g.inStock && g.imageUrls.length > 0)
    .slice(0, 3);
  const featured = byRating.slice(0, 6);

  const counts = new Map<string, number>();
  for (const g of all) counts.set(g.genre, (counts.get(g.genre) ?? 0) + 1);
  const genres = [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));

  return (
    <>
      <Navbar />
      <main>
        <Hero games={heroGames} count={all.length} />
        <Ticker games={all} />
        <FeaturedGrid games={featured} />
        <GenreRail items={genres} />
        <CtaBand count={all.length} />
      </main>
      <Footer />
    </>
  );
}
