export type BookSuggestion = {
  title: string
  authors: string
  isbn: string
  coverUrl: string | null
  description: string | null
}

export async function searchByTitle(title: string): Promise<BookSuggestion[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`
  )
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  return (data.docs ?? []).flatMap((doc: {
    title?: string
    author_name?: string[]
    isbn?: string[]
    cover_i?: number
  }) => {
    const isbn = doc.isbn?.[0]
    if (!isbn) return []
    return [{
      title: doc.title ?? "",
      authors: (doc.author_name ?? []).join(", "),
      isbn,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
        : null,
      description: null,
    }]
  })
}

export async function lookupByIsbn(isbn: string): Promise<BookSuggestion | null> {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
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
    title: book.title ?? "",
    authors: (book.authors ?? []).map((a: { name: string }) => a.name).join(", "),
    isbn,
    coverUrl: book.cover?.medium ?? null,
    description,
  }
}
