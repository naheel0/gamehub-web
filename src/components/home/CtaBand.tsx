import { ArrowRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

export default function CtaBand({ count }: { count: number }) {
  return (
    <section className="relative isolate overflow-hidden border-t border-line">
      <div className="grid-floor absolute inset-0 -z-10" />
      <div className="dither-glow absolute top-1/2 left-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 opacity-70" />
      <div className="mx-auto w-full max-w-4xl px-5 py-28 text-center sm:px-8">
        <Reveal>
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] uppercase">
            Pick your next game
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-lg text-text">
            {count > 0
              ? `${count} titles, rated and priced in rupees, refreshed from the GameHub API every hour.`
              : "Rated and priced in rupees, refreshed from the GameHub API every hour."}
          </p>
          <a
            href="#featured"
            className="group mt-9 inline-flex items-center gap-2 bg-accent px-8 py-4 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Browse the store
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
