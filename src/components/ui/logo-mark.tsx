import { GameController } from "@/components/ui/icons";

/**
 * The GameHub mark: Phosphor's filled gamepad (the old site's logo glyph)
 * in crimson on the dark arena tile. Navbar + footer both render this.
 */
export default function LogoMark() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] border border-line bg-bg-soft">
      <GameController size={17} weight="fill" className="text-accent" />
    </span>
  );
}
