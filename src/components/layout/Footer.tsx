// Evaluated once at build time → stable across prerenders.
const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl tracking-wide text-heading uppercase">GameHub</p>
          <p className="mt-3 max-w-[45ch] text-sm text-muted">
            A game storefront where every title, rating and price is served live from the
            GameHub API.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
          <a href="#featured" className="tracking-widest text-muted uppercase hover:text-heading">
            Store
          </a>
          <a href="#genres" className="tracking-widest text-muted uppercase hover:text-heading">
            Genres
          </a>
          <a href="#top" className="tracking-widest text-muted uppercase hover:text-heading">
            Back to top
          </a>
        </nav>

        <div className="text-sm text-muted">
          <p className="tracking-widest uppercase">Data</p>
          <p className="mt-3 max-w-[40ch]">
            Catalog from the live GameHub API. Artwork via the Steam CDN.
          </p>
          <a
            href="https://github.com/naheel0/GameHub-fullstack"
            rel="noopener noreferrer"
            target="_blank"
            className="mt-3 inline-block text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
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
