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
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  )
  if (!res.ok) throw new Error("Lookup failed")
  const data = await res.json()
  const book = data[`ISBN:${isbn}`]
  if (!book) return null
  const description =
    typeof book.description === "string"
      ? book.description
      : book.description?.value ?? null
  return {
    key: isbn,
    title: book.title ?? "",
    authors: (book.authors ?? []).map((a: { name: string }) => a.name).join(", "),
    isbn,
    coverUrl: book.cover?.medium ?? null,
    description,
  }
}
