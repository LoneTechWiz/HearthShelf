// Shared button/input recipes so every page renders identical controls.
const btnBase =
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50"

export const btnPrimary = `${btnBase} bg-accent px-4 py-2 text-accent-contrast shadow-sm hover:bg-accent-hover`
export const btnSecondary = `${btnBase} border border-edge bg-surface px-4 py-2 text-ink shadow-sm hover:bg-surface-raised`
export const btnSecondarySm = `${btnBase} border border-edge bg-surface px-3 py-1.5 text-xs text-ink hover:bg-surface-raised`
export const btnDanger = `${btnBase} border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40`

export const inputClass =
  "rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"

export const labelClass = "text-sm font-medium text-ink"

export const cardClass = "rounded-xl border border-edge bg-surface shadow-sm"

export const segmentedGroupClass =
  "flex rounded-lg border border-edge bg-surface p-0.5"

export function segmentedButtonClass(active: boolean) {
  return `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
    active ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
  }`
}
