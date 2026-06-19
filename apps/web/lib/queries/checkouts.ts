import { db } from "@/lib/db"
import { books, movies, games, lendableItems, checkouts, contacts } from "@/lib/db/schema"
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm"

export type CheckoutItem = {
  id: string       // refId (book/movie/game id)
  type: "book" | "movie" | "game"
  title: string
  coverUrl: string | null
}

export type ActiveCheckout = {
  id: string
  checkedOutAt: Date
  dueDate: Date | null
  notes: string | null
  item: CheckoutItem
  contact: { id: string; name: string } | null
}

export type CheckoutHistory = ActiveCheckout & { returnedAt: Date }

function resolveItem(row: {
  lendableType: "book" | "movie" | "game"
  refId: string
  bookTitle: string | null
  bookCoverUrl: string | null
  movieTitle: string | null
  moviePosterUrl: string | null
  gameTitle: string | null
  gameCoverUrl: string | null
}): CheckoutItem {
  if (row.lendableType === "movie") {
    return { id: row.refId, type: "movie", title: row.movieTitle ?? "", coverUrl: row.moviePosterUrl }
  }
  if (row.lendableType === "game") {
    return { id: row.refId, type: "game", title: row.gameTitle ?? "", coverUrl: row.gameCoverUrl }
  }
  return { id: row.refId, type: "book", title: row.bookTitle ?? "", coverUrl: row.bookCoverUrl }
}

export async function getActiveCheckouts(userId: string): Promise<ActiveCheckout[]> {
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      dueDate: checkouts.dueDate,
      notes: checkouts.notes,
      lendableType: lendableItems.type,
      refId: lendableItems.refId,
      bookTitle: books.title,
      bookCoverUrl: books.coverUrl,
      movieTitle: movies.title,
      moviePosterUrl: movies.posterUrl,
      gameTitle: games.title,
      gameCoverUrl: games.coverUrl,
      contactId: contacts.id,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(lendableItems, eq(checkouts.lendableItemId, lendableItems.id))
    .leftJoin(books, and(eq(lendableItems.type, "book"), eq(books.id, lendableItems.refId)))
    .leftJoin(movies, and(eq(lendableItems.type, "movie"), eq(movies.id, lendableItems.refId)))
    .leftJoin(games, and(eq(lendableItems.type, "game"), eq(games.id, lendableItems.refId)))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(and(eq(checkouts.userId, userId), isNull(checkouts.returnedAt)))
    .orderBy(desc(checkouts.checkedOutAt))

  return rows.map((r) => ({
    id: r.id,
    checkedOutAt: r.checkedOutAt,
    dueDate: r.dueDate,
    notes: r.notes,
    item: resolveItem(r),
    contact: r.contactId ? { id: r.contactId, name: r.contactName! } : null,
  }))
}

export async function getCheckoutHistory(userId: string): Promise<CheckoutHistory[]> {
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      returnedAt: checkouts.returnedAt,
      dueDate: checkouts.dueDate,
      notes: checkouts.notes,
      lendableType: lendableItems.type,
      refId: lendableItems.refId,
      bookTitle: books.title,
      bookCoverUrl: books.coverUrl,
      movieTitle: movies.title,
      moviePosterUrl: movies.posterUrl,
      gameTitle: games.title,
      gameCoverUrl: games.coverUrl,
      contactId: contacts.id,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(lendableItems, eq(checkouts.lendableItemId, lendableItems.id))
    .leftJoin(books, and(eq(lendableItems.type, "book"), eq(books.id, lendableItems.refId)))
    .leftJoin(movies, and(eq(lendableItems.type, "movie"), eq(movies.id, lendableItems.refId)))
    .leftJoin(games, and(eq(lendableItems.type, "game"), eq(games.id, lendableItems.refId)))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(and(eq(checkouts.userId, userId), isNotNull(checkouts.returnedAt)))
    .orderBy(desc(checkouts.returnedAt))

  return rows.map((r) => ({
    id: r.id,
    checkedOutAt: r.checkedOutAt,
    returnedAt: r.returnedAt!,
    dueDate: r.dueDate,
    notes: r.notes,
    item: resolveItem(r),
    contact: r.contactId ? { id: r.contactId, name: r.contactName! } : null,
  }))
}

export async function createCheckoutRecord(
  userId: string,
  data: { lendableItemId: string; contactId: string | null; dueDate: Date | null; notes: string | null }
): Promise<void> {
  await db.insert(checkouts).values({ userId, ...data })
}

export async function returnItemRecord(checkoutId: string, userId: string): Promise<void> {
  await db
    .update(checkouts)
    .set({ returnedAt: new Date() })
    .where(and(eq(checkouts.id, checkoutId), eq(checkouts.userId, userId)))
}
