import type { BookRow } from "@/lib/queries/books"

export type CollectionBook = Pick<
  BookRow,
  "id" | "title" | "authors" | "isbn" | "coverUrl" | "seriesName" | "seriesPosition" | "seriesTotal"
>

export type CollectionItem = {
  identity: string
  title: string
  authors: string | null
  isbn: string | null
  coverUrl: string | null
  seriesPosition: number | null
  copyCount: number
  bookIds: string[]
}

export type AuthorCollection = {
  author: string
  ownedCount: number
  books: CollectionItem[]
}

export type SeriesCollection = {
  seriesName: string
  ownedCount: number
  totalCount: number | null
  books: CollectionItem[]
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? ""
}

function bookIdentity(book: CollectionBook): string {
  const isbn = normalizeText(book.isbn).replace(/[-\s]/g, "")
  if (isbn) return `isbn:${isbn}`
  return `title:${normalizeText(book.title)}|authors:${normalizeText(book.authors)}`
}

function uniqueItems(books: CollectionBook[]): CollectionItem[] {
  const byIdentity = new Map<string, CollectionItem>()

  for (const book of books) {
    const identity = bookIdentity(book)
    const existing = byIdentity.get(identity)
    if (existing) {
      existing.copyCount++
      existing.bookIds.push(book.id)
      continue
    }

    byIdentity.set(identity, {
      identity,
      title: book.title,
      authors: book.authors,
      isbn: book.isbn,
      coverUrl: book.coverUrl,
      seriesPosition: book.seriesPosition,
      copyCount: 1,
      bookIds: [book.id],
    })
  }

  return [...byIdentity.values()].sort((a, b) => {
    const aPosition = a.seriesPosition ?? Number.MAX_SAFE_INTEGER
    const bPosition = b.seriesPosition ?? Number.MAX_SAFE_INTEGER
    if (aPosition !== bPosition) return aPosition - bPosition
    return a.title.localeCompare(b.title)
  })
}

export function buildAuthorCollections(books: CollectionBook[]): AuthorCollection[] {
  const byAuthor = new Map<string, CollectionBook[]>()

  for (const book of books) {
    const author = book.authors?.trim() || "Unknown author"
    byAuthor.set(author, [...(byAuthor.get(author) ?? []), book])
  }

  return [...byAuthor.entries()]
    .map(([author, groupedBooks]) => {
      const items = uniqueItems(groupedBooks)
      return { author, ownedCount: items.length, books: items }
    })
    .sort((a, b) => a.author.localeCompare(b.author))
}

export function buildSeriesCollections(books: CollectionBook[]): SeriesCollection[] {
  const bySeries = new Map<string, CollectionBook[]>()

  for (const book of books) {
    const seriesName = book.seriesName?.trim()
    if (!seriesName) continue
    bySeries.set(seriesName, [...(bySeries.get(seriesName) ?? []), book])
  }

  return [...bySeries.entries()]
    .map(([seriesName, groupedBooks]) => {
      const items = uniqueItems(groupedBooks)
      const declaredTotal = Math.max(0, ...groupedBooks.map((book) => book.seriesTotal ?? 0))
      return {
        seriesName,
        ownedCount: items.length,
        totalCount: declaredTotal > 0 ? declaredTotal : null,
        books: items,
      }
    })
    .sort((a, b) => a.seriesName.localeCompare(b.seriesName))
}
