function LogoMark() {
  // crimson arena slash — authored SVG, one consistent stroke
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
      <path d="M4 24 L14 4 L18 4 L8 24 Z" fill="#ff2d55" />
      <path d="M14 24 L24 4 L28 4 L18 24 Z" fill="#f4f1f2" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-2xl leading-none tracking-wide text-heading uppercase">
            GameHub
          </span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-8 sm:flex">
          <a
            href="#featured"
            className="text-sm tracking-[0.16em] text-muted uppercase transition-colors duration-200 hover:text-heading"
          >
            Store
          </a>
          <a
            href="#genres"
            className="text-sm tracking-[0.16em] text-muted uppercase transition-colors duration-200 hover:text-heading"
          >
            Genres
          </a>
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Live catalog
          </span>
        </nav>

        <a
          href="#featured"
          className="bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
        >
          Browse the store
        </a>
      </div>
    </header>
  );
}
