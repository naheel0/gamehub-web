import Link from "next/link";

// Evaluated once at build time → stable across prerenders.
const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl tracking-wide text-heading uppercase">GameHub</p>
          <p className="mt-3 max-w-[45ch] text-sm text-muted">
            Discover, compare and buy games — every title, rating and price in rupees.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
          <Link href="/games" className="tracking-widest text-muted uppercase hover:text-heading">
            Store
          </Link>
          <Link href="/#genres" className="tracking-widest text-muted uppercase hover:text-heading">
            Genres
          </Link>
          <Link href="/profile" className="tracking-widest text-muted uppercase hover:text-heading">
            Profile
          </Link>
          <Link href="#top" className="tracking-widest text-muted uppercase hover:text-heading">
            Back to top
          </Link>
        </nav>

        <div className="text-sm text-muted">
          <p className="tracking-widest uppercase">Legal</p>
          <p className="mt-3 max-w-[40ch]">
            Game titles, ratings and prices are supplied by GameHub. Artwork remains the
            property of its respective publishers.
          </p>
          <nav aria-label="Legal" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="tracking-widest text-muted uppercase hover:text-heading">
              Privacy
            </Link>
            <Link href="/terms" className="tracking-widest text-muted uppercase hover:text-heading">
              Terms
            </Link>
            <Link href="/refunds" className="tracking-widest text-muted uppercase hover:text-heading">
              Refunds
            </Link>
            <Link href="/cookies" className="tracking-widest text-muted uppercase hover:text-heading">
              Cookies
            </Link>
          </nav>
          <a
            href="https://github.com/naheel0/GameHub-fullstack"
            rel="noopener noreferrer"
            target="_blank"
            className="mt-4 inline-block text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
          >
            Source on GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center font-mono text-xs tracking-widest text-muted uppercase">
        © {YEAR} GameHub
      </div>
    </footer>
  );
}
