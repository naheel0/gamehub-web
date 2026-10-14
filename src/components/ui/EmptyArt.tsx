/**
 * Animated 2D art — hand-drawn SVG motifs (coin, heart, cabinet, medal,
 * glint) used across empty states, the checkout poster, the payment check,
 * the achievement card, and the landing hero. Decorative only: always
 * aria-hidden beside real copy, motion lives in the globals.css keyframes
 * (coin-spin / heart-beat / screen-flicker / insert-blink / glint, plus
 * badge-pop reused on the medal), each in the prefers-reduced-motion kill
 * list so the art stays complete at rest.
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

export function MedalArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      {/* ribbons — tucked behind the medal disc */}
      <path d="M20 4l10 22-6 3L14 7z" className="text-muted" fill="currentColor" opacity="0.55" />
      <path d="M44 4L34 26l6 3 10-22z" className="text-muted" fill="currentColor" opacity="0.55" />
      {/* medal disc — the coin's accent language (dashed ring + accent core) */}
      <circle cx="32" cy="42" r="17" className="text-accent" fill="currentColor" opacity="0.12" />
      <circle cx="32" cy="42" r="17" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" />
      <circle
        cx="32"
        cy="42"
        r="12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        className="text-accent"
      />
      <path
        d="M32 34L33.9 39.4 39.6 39.5 35 43 36.7 48.5 32 45.2 27.3 48.5 29 43 24.4 39.5 30.1 39.4Z"
        className="text-accent"
        fill="currentColor"
      />
    </svg>
  );
}

export function GlintArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z"
        fill="currentColor"
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
