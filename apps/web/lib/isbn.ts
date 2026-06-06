/**
 * Normalize a raw scanned/typed ISBN: strip spaces and hyphens, then validate
 * it is a 10- or 13-digit ISBN. ISBN-10 may end in a check character "X".
 * Returns the cleaned string, or null if it is not a valid ISBN shape.
 */
export function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase()
  if (/^\d{13}$/.test(cleaned)) return cleaned
  if (/^\d{9}[\dX]$/.test(cleaned)) return cleaned
  return null
}
