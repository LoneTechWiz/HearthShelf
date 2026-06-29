import type { BookRow } from "@/lib/queries/books"
import type { MovieRow } from "@/lib/queries/movies"
import type { GameRow } from "@/lib/queries/games"

export type CollectionBook = Pick<
  BookRow,
  "id" | "title" | "authors" | "isbn" | "coverUrl" | "seriesName" | "seriesPosition" | "seriesTotal"
>

export type CollectionMovie = Pick<
  MovieRow,
  "id" | "title" | "director" | "year" | "posterUrl" | "genre" | "format"
>

export type CollectionGame = Pick<
  GameRow,
  "id" | "title" | "coverUrl" | "genre" | "minPlayers" | "maxPlayers" | "ageRating"
>

export type CollectionItem = {
  identity: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string
  position: number | null
  copyCount: number
  itemIds: string[]
}

export type ShelfCollection = {
  name: string
  ownedCount: number
  totalCount?: number | null
  items: CollectionItem[]
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? ""
}

function uniqueItems<T>(
  items: T[],
  identity: (item: T) => string,
  toCollectionItem: (item: T) => Omit<CollectionItem, "identity" | "copyCount" | "itemIds">
): CollectionItem[] {
  const byIdentity = new Map<string, CollectionItem>()

  for (const item of items) {
    const key = identity(item)
    const existing = byIdentity.get(key)
    const nextItem = toCollectionItem(item)

    if (existing) {
      existing.copyCount++
      existing.itemIds.push(nextItem.href)
      continue
    }

    byIdentity.set(key, {
      ...nextItem,
      identity: key,
      copyCount: 1,
      itemIds: [nextItem.href],
    })
  }

  return [...byIdentity.values()].sort((a, b) => {
    const aPosition = a.position ?? Number.MAX_SAFE_INTEGER
    const bPosition = b.position ?? Number.MAX_SAFE_INTEGER
    if (aPosition !== bPosition) return aPosition - bPosition
    return a.title.localeCompare(b.title)
  })
}

function bookIdentity(book: CollectionBook): string {
  const isbn = normalizeText(book.isbn).replace(/[-\s]/g, "")
  if (isbn) return `isbn:${isbn}`
  return `book:${normalizeText(book.title)}|authors:${normalizeText(book.authors)}`
}

function movieIdentity(movie: CollectionMovie): string {
  return `movie:${normalizeText(movie.title)}|year:${movie.year ?? ""}`
}

function gameIdentity(game: CollectionGame): string {
  return `game:${normalizeText(game.title)}`
}

function bookItem(book: CollectionBook): Omit<CollectionItem, "identity" | "copyCount" | "itemIds"> {
  return {
    title: book.title,
    subtitle: book.authors,
    imageUrl: book.coverUrl,
    href: `/books/${book.id}`,
    position: book.seriesPosition,
  }
}

function movieItem(movie: CollectionMovie): Omit<CollectionItem, "identity" | "copyCount" | "itemIds"> {
  return {
    title: titleWithYear(movie.title, movie.year),
    subtitle: movie.director,
    imageUrl: movie.posterUrl,
    href: `/movies/${movie.id}`,
    position: null,
  }
}

function gameItem(game: CollectionGame): Omit<CollectionItem, "identity" | "copyCount" | "itemIds"> {
  return {
    title: game.title,
    subtitle: playerCount(game.minPlayers, game.maxPlayers),
    imageUrl: game.coverUrl,
    href: `/games/${game.id}`,
    position: null,
  }
}

function titleWithYear(title: string, year: number | null): string {
  return year ? `${title} (${year})` : title
}

function playerCount(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min === max) return `${min} players`
  if (!max) return `${min}+ players`
  if (!min) return `Up to ${max} players`
  return `${min}-${max} players`
}

function groupBy<T>(
  items: T[],
  groupName: (item: T) => string | null,
  identity: (item: T) => string,
  toCollectionItem: (item: T) => Omit<CollectionItem, "identity" | "copyCount" | "itemIds">
): ShelfCollection[] {
  const byGroup = new Map<string, T[]>()

  for (const item of items) {
    const name = groupName(item)
    if (!name) continue
    byGroup.set(name, [...(byGroup.get(name) ?? []), item])
  }

  return [...byGroup.entries()]
    .map(([name, groupedItems]) => {
      const unique = uniqueItems(groupedItems, identity, toCollectionItem)
      return { name, ownedCount: unique.length, items: unique }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function buildBookAuthorCollections(books: CollectionBook[]): ShelfCollection[] {
  return groupBy(
    books,
    (book) => book.authors?.trim() || "Unknown author",
    bookIdentity,
    bookItem
  )
}

export function buildBookSeriesCollections(books: CollectionBook[]): ShelfCollection[] {
  const bySeries = new Map<string, CollectionBook[]>()

  for (const book of books) {
    const seriesName = book.seriesName?.trim()
    if (!seriesName) continue
    bySeries.set(seriesName, [...(bySeries.get(seriesName) ?? []), book])
  }

  return [...bySeries.entries()]
    .map(([name, groupedBooks]) => {
      const unique = uniqueItems(groupedBooks, bookIdentity, bookItem)
      const declaredTotal = Math.max(0, ...groupedBooks.map((book) => book.seriesTotal ?? 0))
      return {
        name,
        ownedCount: unique.length,
        totalCount: declaredTotal > 0 ? declaredTotal : null,
        items: unique,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function buildMovieDirectorCollections(movies: CollectionMovie[]): ShelfCollection[] {
  return groupBy(
    movies,
    (movie) => movie.director?.trim() || "Unknown director",
    movieIdentity,
    movieItem
  )
}

export function buildMovieGenreCollections(movies: CollectionMovie[]): ShelfCollection[] {
  return groupBy(
    movies,
    (movie) => movie.genre?.trim() || "Uncategorized",
    movieIdentity,
    movieItem
  )
}

export function buildGameCategoryCollections(games: CollectionGame[]): ShelfCollection[] {
  return groupBy(
    games,
    (game) => game.genre?.trim() || "Uncategorized",
    gameIdentity,
    gameItem
  )
}

export function buildGamePlayerCollections(games: CollectionGame[]): ShelfCollection[] {
  return groupBy(
    games,
    (game) => playerCount(game.minPlayers, game.maxPlayers) || "Player count unknown",
    gameIdentity,
    gameItem
  )
}
