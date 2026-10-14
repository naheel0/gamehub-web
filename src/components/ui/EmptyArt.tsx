/**
 * Animated empty-state art (2D) — decorative companions beside the real
 * copy, never replacing it: always aria-hidden, motion lives in the
 * globals.css keyframes (coin-spin / heart-beat / screen-flicker /
 * insert-blink), each in the prefers-reduced-motion kill list so the art
 * stays complete at rest.
 */

export function CoinArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={`coin-spin ${className ?? ""}`}>
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
      <circle
        cx="32"
        cy="32"
        r="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 5"
        className="text-accent"
      />
      <path d="M32 24l6 8-6 8-6-8z" className="text-accent" fill="currentColor" />
    </svg>
  );
}

export function HeartArt({ className }: { className?: string }) {
  const heart =
    "M32 54C12 40 6 28 12 19c5-8 15-8 20 1 5-9 15-9 20 0 6 9 0 21-20 34z";
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={`heart-beat ${className ?? ""}`}>
      <path d={heart} className="text-accent" fill="currentColor" opacity="0.16" />
      <path
        d={heart}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="text-muted"
      />
    </svg>
  );
}

export function CabinetArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" aria-hidden className={className}>
      {/* cabinet body + marquee */}
      <rect x="14" y="6" width="92" height="140" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" />
      <rect x="24" y="14" width="72" height="14" rx="2" className="text-accent" fill="currentColor" opacity="0.75" />
      {/* screen: dim steady glow, CRT flicker while motion is allowed */}
      <rect x="24" y="36" width="72" height="50" rx="3" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
      <rect x="27" y="39" width="66" height="44" rx="2" className="screen-flicker text-accent" fill="currentColor" opacity="0.3" />
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fontSize="10"
        letterSpacing="1.5"
        fontWeight="700"
        className="insert-blink font-mono text-accent"
        fill="currentColor"
      >
        INSERT COIN
      </text>
      {/* control deck: joystick + two buttons, then the coin door */}
      <rect x="24" y="94" width="72" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
      <line x1="38" y1="96" x2="38" y2="104" stroke="currentColor" strokeWidth="3" className="text-muted" />
      <circle cx="38" cy="107" r="4" className="text-accent" fill="currentColor" />
      <circle cx="68" cy="106" r="4" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" />
      <circle cx="82" cy="106" r="4" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
      <rect x="48" y="132" width="24" height="6" rx="1" className="text-muted" fill="currentColor" />
      {/* legs */}
      <line x1="28" y1="146" x2="28" y2="156" stroke="currentColor" strokeWidth="4" className="text-muted" />
      <line x1="92" y1="146" x2="92" y2="156" stroke="currentColor" strokeWidth="4" className="text-muted" />
    </svg>
  );
}
