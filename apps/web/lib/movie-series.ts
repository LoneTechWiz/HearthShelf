const EPISODE_PREFIX = /^(.+?):\s*episode\s+[ivxlcdm0-9]+\b/i

export function inferMovieSeriesName(title: string): string | null {
  const normalized = title.trim().replace(/\s+/g, " ")
  if (!normalized) return null

  const episodeMatch = normalized.match(EPISODE_PREFIX)
  if (episodeMatch?.[1]) return episodeMatch[1].trim()

  const dashIndex = normalized.indexOf(" - ")
  if (dashIndex > 0) return normalized.slice(0, dashIndex).trim()

  const colonIndex = normalized.indexOf(":")
  if (colonIndex > 0) return normalized.slice(0, colonIndex).trim()

  return null
}
