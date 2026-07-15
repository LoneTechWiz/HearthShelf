export type BookSuggestion = {
  key: string
  title: string
  authors: string
  isbn: string | null
  seriesKey: string | null
  seriesName: string | null
  seriesPosition: number | null
  seriesTotal: number | null
  genre: string | null
  coverUrl: string | null
  description: string | null
}

export async function searchByTitle(title: string): Promise<BookSuggestion[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&fields=key,title,author_name,isbn,cover_i,series_key,series_name,series_position,subject&limit=5`
  )
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  const suggestions = (data.docs ?? []).map((doc: SearchDoc) => {
    const series = readSeriesFromSearchDoc(doc)
    return {
      key: doc.key ?? "",
      title: doc.title ?? "",
      authors: (doc.author_name ?? []).join(", "),
      isbn: doc.isbn?.[0] ?? null,
      seriesKey: series.key,
      seriesName: series.name,
      seriesPosition: series.position,
      seriesTotal: null,
      genre: readGenre(doc.subject),
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
        : null,
      description: null,
    }
  })
  return withSeriesTotals(suggestions)
}

type SearchDoc = {
  key?: string
  title?: string
  author_name?: string[]
  isbn?: string[] | null
  cover_i?: number
  series_key?: string[] | null
  series_name?: string[] | null
  series_position?: string[] | null
  subject?: string[] | null
}

type SeriesInfo = {
  key: string | null
  name: string | null
  position: number | null
  total: number | null
}

const GENRE_MATCHERS = [
  ["Science fiction", /\bscience[- ]fiction\b/i],
  ["Historical fiction", /\bhistorical fiction\b/i],
  ["Fantasy", /\bfantasy(?: fiction)?\b/i],
  ["Mystery", /\b(?:mystery|detective fiction)\b/i],
  ["Thriller", /\b(?:thriller|suspense fiction)\b/i],
  ["Romance", /\bromance(?: fiction| novel)?\b/i],
  ["Horror", /\bhorror(?: fiction)?\b/i],
  ["Young adult", /\byoung adult\b/i],
  ["Children's fiction", /\b(?:juvenile|children'?s) fiction\b/i],
  ["Graphic novels", /\b(?:graphic novels?|comic books?)\b/i],
  ["Poetry", /\bpoetry\b/i],
  ["Drama", /\bdrama\b/i],
  ["Biography", /\bbiograph(?:y|ies|ical)\b/i],
  ["Memoir", /\bmemoirs?\b/i],
  ["True crime", /\btrue crime\b/i],
  ["Self-help", /\bself[- ]help\b/i],
  ["Business", /\bbusiness(?: and economics)?\b/i],
  ["Cooking", /\b(?:cooking|cookbooks?)\b/i],
  ["Travel", /\btravel\b/i],
  ["Religion", /\breligion\b/i],
  ["Philosophy", /\bphilosophy\b/i],
  ["Psychology", /\bpsychology\b/i],
  ["History", /^history\b/i],
  ["Technology", /\btechnology\b/i],
  ["Science", /^science\b/i],
  ["Art", /^art\b/i],
  ["Humor", /\bhumou?r\b/i],
  ["Sports", /\bsports\b/i],
  ["Fiction", /^fiction\.?$/i],
] as const

function readSeriesFromSearchDoc(doc: SearchDoc): Omit<SeriesInfo, "total"> {
  return {
    key: normalizeSeriesKey(doc.series_key?.[0] ?? null),
    name: doc.series_name?.[0] ?? null,
    position: parseSeriesPosition(doc.series_position?.[0] ?? null),
  }
}

function readSeriesFromWork(work: {
  series?: Array<{ series?: { key?: string | null }; position?: string | null }>
}): Omit<SeriesInfo, "name" | "total"> {
  const entry = work.series?.[0]
  return {
    key: normalizeSeriesKey(entry?.series?.key ?? null),
    position: parseSeriesPosition(entry?.position ?? null),
  }
}

function normalizeSeriesKey(key: string | null): string | null {
  if (!key) return null
  return key.replace(/^\/series\//, "") || null
}

function parseSeriesPosition(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function readGenre(subjects: unknown): string | null {
  if (!Array.isArray(subjects)) return null

  const names = subjects.flatMap((subject) => {
    const name = typeof subject === "string"
      ? subject
      : subject && typeof subject === "object" && "name" in subject
        ? subject.name
        : null
    return typeof name === "string" && name.trim() ? [name.trim()] : []
  })

  for (const [genre, pattern] of GENRE_MATCHERS) {
    if (names.some((name) => pattern.test(name))) return genre
  }

  return names.length === 1 ? names[0].replace(/[.\s]+$/, "") : null
}

async function withSeriesTotals(suggestions: BookSuggestion[]): Promise<BookSuggestion[]> {
  const seriesKeys = Array.from(
    new Set(suggestions.map((suggestion) => suggestion.seriesKey).filter(Boolean))
  ) as string[]
  if (seriesKeys.length === 0) return suggestions

  const entries = await Promise.all(
    seriesKeys.map(async (key) => [key, await lookupSeriesInfo(key)] as const)
  )
  const seriesInfo = new Map(entries)

  return suggestions.map((suggestion) => {
    if (!suggestion.seriesKey) return suggestion
    const info = seriesInfo.get(suggestion.seriesKey)
    if (!info) return suggestion
    return {
      ...suggestion,
      seriesName: suggestion.seriesName ?? info.name,
      seriesTotal: info.total,
    }
  })
}

async function lookupSeriesInfo(seriesKey: string): Promise<Pick<SeriesInfo, "name" | "total"> | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=series_key:${encodeURIComponent(seriesKey)}&fields=title,series_name,series_position&limit=100`
    )
    if (!res.ok) return null
    const data = await res.json()
    let name: string | null = null
    let total: number | null = null

    for (const doc of (data.docs ?? []) as Array<{
      series_name?: string[] | null
      series_position?: string[] | null
    }>) {
      name ??= doc.series_name?.[0] ?? null
      const position = parseSeriesPosition(doc.series_position?.[0] ?? null)
      if (position) total = Math.max(total ?? 0, position)
    }

    return { name, total }
  } catch {
    return null
  }
}

export async function lookupByIsbn(isbn: string): Promise<BookSuggestion | null> {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`
  )
  if (!res.ok) throw new Error("Lookup failed")
  const data = await res.json()
  const entry = data[`ISBN:${isbn}`]
  if (!entry) return null

  const details = entry.details ?? {}
  const workKey: string | null = details.works?.[0]?.key ?? null

  let description: string | null = null
  let genre = readGenre(details.genres) ?? readGenre(details.subjects)
  let series: SeriesInfo = {
    key: null,
    name: null,
    position: null,
    total: null,
  }

  if (workKey) {
    try {
      const workRes = await fetch(`https://openlibrary.org${workKey}.json`)
      if (workRes.ok) {
        const work = await workRes.json()
        description =
          typeof work.description === "string"
            ? work.description
            : work.description?.value ?? null
        genre = readGenre(work.subjects) ?? genre
        const workSeries = readSeriesFromWork(work)
        if (workSeries.key) {
          const seriesInfo = await lookupSeriesInfo(workSeries.key)
          series = {
            key: workSeries.key,
            name: seriesInfo?.name ?? null,
            position: workSeries.position,
            total: seriesInfo?.total ?? null,
          }
        }
      }
    } catch {
      // description and series stay null
    }
  }

  return {
    key: isbn,
    title: details.title ?? "",
    authors: (details.authors ?? []).map((a: { name: string }) => a.name).join(", "),
    isbn,
    seriesKey: series.key,
    seriesName: series.name,
    seriesPosition: series.position,
    seriesTotal: series.total,
    genre,
    coverUrl: details.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${details.covers[0]}-M.jpg`
      : null,
    description,
  }
}
