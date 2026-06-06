export type BookSuggestion = {
  key: string
  title: string
  authors: string
  isbn: string | null
  coverUrl: string | null
  description: string | null
}

export async function searchByTitle(title: string): Promise<BookSuggestion[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`
  )
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  return (data.docs ?? []).map((doc: {
    key?: string
    title?: string
    author_name?: string[]
    isbn?: string[] | null
    cover_i?: number
  }) => ({
    key: doc.key ?? "",
    title: doc.title ?? "",
    authors: (doc.author_name ?? []).join(", "),
    isbn: doc.isbn?.[0] ?? null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
      : null,
    description: null,
  }))
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
  if (workKey) {
    try {
      const workRes = await fetch(`https://openlibrary.org${workKey}.json`)
      if (workRes.ok) {
        const work = await workRes.json()
        description =
          typeof work.description === "string"
            ? work.description
            : work.description?.value ?? null
      }
    } catch {
      // description stays null
    }
  }

  return {
    key: isbn,
    title: details.title ?? "",
    authors: (details.authors ?? []).map((a: { name: string }) => a.name).join(", "),
    isbn,
    coverUrl: details.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${details.covers[0]}-M.jpg`
      : null,
    description,
  }
}
