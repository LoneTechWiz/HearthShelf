export function HearthGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.5c2 2.2 3.75 4 3.75 6.75a3.75 3.75 0 1 1-7.5 0C8.25 7.5 10 5.7 12 3.5z"
        fill="currentColor"
      />
      <path
        d="M4 17.5h16M6.5 17.5V20.5M17.5 17.5V20.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <HearthGlyph className="h-5 w-5 text-accent" />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Hearthshelf
      </span>
    </span>
  )
}
