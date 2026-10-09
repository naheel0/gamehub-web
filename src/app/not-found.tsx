import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70svh] w-full max-w-xl flex-col items-start justify-center px-5 py-28">
        <p className="font-mono text-xs tracking-[0.16em] text-accent uppercase">404</p>
        <h1 className="mt-3 font-display text-5xl uppercase">Not in the arena.</h1>
        <p className="mt-4 text-text">
          That title is not in the GameHub catalog — it may have been delisted, or the
          link is off.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
        >
          Back to the store
        </Link>
      </main>
      <Footer />
    </>
  );
}
