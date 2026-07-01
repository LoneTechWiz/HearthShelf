import { db } from "@/lib/db"
import { books, games, lendableItems, movies, shelfEventItems, shelfEvents } from "@/lib/db/schema"
import { and, asc, eq, inArray } from "drizzle-orm"

export type EventType = "book_club" | "movie_night" | "game_night"
export type EventRecurrence = "none" | "weekly" | "monthly"

export type ShelfEventItem = {
  id: string
  type: "book" | "movie" | "game"
  title: string
  subtitle: string | null
}

export type ShelfEvent = typeof shelfEvents.$inferSelect & {
  items: ShelfEventItem[]
}

function resolveEventItem(row: {
  lendableItemId: string | null
  lendableType: "book" | "movie" | "game" | null
  bookTitle: string | null
  bookAuthors: string | null
  movieTitle: string | null
  movieDirector: string | null
  gameTitle: string | null
  gameGenre: string | null
}): ShelfEventItem | null {
  if (!row.lendableItemId || !row.lendableType) return null
  if (row.lendableType === "movie") {
    return {
      id: row.lendableItemId,
      type: "movie",
      title: row.movieTitle ?? "",
      subtitle: row.movieDirector,
    }
  }
  if (row.lendableType === "game") {
    return {
      id: row.lendableItemId,
      type: "game",
      title: row.gameTitle ?? "",
      subtitle: row.gameGenre,
    }
  }
  return {
    id: row.lendableItemId,
    type: "book",
    title: row.bookTitle ?? "",
    subtitle: row.bookAuthors,
  }
}

export async function getEventsForUser(userId: string): Promise<ShelfEvent[]> {
  const rows = await db
    .select({
      id: shelfEvents.id,
      userId: shelfEvents.userId,
      title: shelfEvents.title,
      type: shelfEvents.type,
      startsAt: shelfEvents.startsAt,
      recurrence: shelfEvents.recurrence,
      notes: shelfEvents.notes,
      createdAt: shelfEvents.createdAt,
      lendableItemId: shelfEventItems.lendableItemId,
      lendableType: lendableItems.type,
      bookTitle: books.title,
      bookAuthors: books.authors,
      movieTitle: movies.title,
      movieDirector: movies.director,
      gameTitle: games.title,
      gameGenre: games.genre,
    })
    .from(shelfEvents)
    .leftJoin(shelfEventItems, eq(shelfEvents.id, shelfEventItems.eventId))
    .leftJoin(lendableItems, eq(shelfEventItems.lendableItemId, lendableItems.id))
    .leftJoin(books, and(eq(lendableItems.type, "book"), eq(books.id, lendableItems.refId)))
    .leftJoin(movies, and(eq(lendableItems.type, "movie"), eq(movies.id, lendableItems.refId)))
    .leftJoin(games, and(eq(lendableItems.type, "game"), eq(games.id, lendableItems.refId)))
    .where(eq(shelfEvents.userId, userId))
    .orderBy(asc(shelfEvents.startsAt))

  const byId = new Map<string, ShelfEvent>()
  for (const row of rows) {
    const event = byId.get(row.id) ?? {
      id: row.id,
      userId: row.userId,
      title: row.title,
      type: row.type,
      startsAt: row.startsAt,
      recurrence: row.recurrence,
      notes: row.notes,
      createdAt: row.createdAt,
      items: [],
    }
    const item = resolveEventItem(row)
    if (item) event.items.push(item)
    byId.set(row.id, event)
  }

  return Array.from(byId.values())
}

export async function createEventRecord(
  userId: string,
  data: {
    title: string
    type: EventType
    startsAt: Date
    recurrence: EventRecurrence
    lendableItemIds: string[]
    notes: string | null
  }
): Promise<boolean> {
  const lendableItemIds = Array.from(new Set(data.lendableItemIds))
  if (lendableItemIds.length > 0) {
    const items = await db
      .select({ id: lendableItems.id })
      .from(lendableItems)
      .where(and(inArray(lendableItems.id, lendableItemIds), eq(lendableItems.userId, userId)))
    if (items.length !== lendableItemIds.length) return false
  }

  await db.transaction(async (tx) => {
    const [event] = await tx
      .insert(shelfEvents)
      .values({
        userId,
        title: data.title,
        type: data.type,
        startsAt: data.startsAt,
        recurrence: data.recurrence,
        notes: data.notes,
      })
      .returning({ id: shelfEvents.id })

    if (lendableItemIds.length > 0) {
      await tx.insert(shelfEventItems).values(
        lendableItemIds.map((lendableItemId) => ({
          eventId: event.id,
          lendableItemId,
        }))
      )
    }
  })

  return true
}

export async function deleteEventRecord(id: string, userId: string): Promise<void> {
  await db.delete(shelfEvents).where(and(eq(shelfEvents.id, id), eq(shelfEvents.userId, userId)))
}
