import { GameController } from "@/components/ui/icons";

/**
 * The GameHub mark: Phosphor's filled gamepad (the old site's logo glyph)
 * in crimson, bare — no tile, no frame. Navbar + footer both render this.
 */
export default function LogoMark() {
  return <GameController size={26} weight="fill" className="text-accent" />;
}
