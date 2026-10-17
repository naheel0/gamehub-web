/** One-shot success line after a PRG redirect (created/saved/deleted).
 *  key-remounted so a fresh message re-enters through deal-in. */
export default function Flash({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p
      key={msg}
      role="status"
      className="deal-in border-l-2 border-accent bg-bg px-4 py-3 font-mono text-xs text-text"
    >
      {msg}
    </p>
  );
}
