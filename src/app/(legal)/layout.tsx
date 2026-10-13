import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/** Shared chrome for the (legal) document pages — narrow prose column. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="top" className="mx-auto w-full max-w-3xl px-5 pt-24 pb-20 sm:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
