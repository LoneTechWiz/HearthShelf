import { db } from "@/lib/db"
import { books, movies, games, lendableItems, checkouts, contacts } from "@/lib/db/schema"
import { and, count, desc, eq, isNull, lt, sql } from "drizzle-orm"

export type DashboardStats = {
  totalBooks: number
  totalMovies: number
  totalGames: number
  checkedOutNow: number
  overdue: number
  totalContacts: number
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [[bookCount], [movieCount], [gameCount], [activeCount], [overdueCount], [contactCount]] =
    await Promise.all([
      db.select({ value: count() }).from(books).where(eq(books.userId, userId)),
      db.select({ value: count() }).from(movies).where(eq(movies.userId, userId)),
      db.select({ value: count() }).from(games).where(eq(games.userId, userId)),
      db
        .select({ value: count() })
        .from(checkouts)
        .where(and(eq(checkouts.userId, userId), isNull(checkouts.returnedAt))),
      db
        .select({ value: count() })
        .from(checkouts)
        .where(
          and(
            eq(checkouts.userId, userId),
            isNull(checkouts.returnedAt),
            lt(checkouts.dueDate, new Date())
          )
        ),
      db.select({ value: count() }).from(contacts).where(eq(contacts.userId, userId)),
    ])

  return {
    totalBooks: bookCount.value,
    totalMovies: movieCount.value,
    totalGames: gameCount.value,
    checkedOutNow: activeCount.value,
    overdue: overdueCount.value,
    totalContacts: contactCount.value,
  }
}

export type ActivityEvent = {
  checkoutId: string
  type: "checkout" | "return"
  itemId: string
  itemType: "book" | "movie" | "game"
  itemTitle: string
  contactName: string | null
  at: Date
}

export async function getRecentActivity(userId: string, limit = 5): Promise<ActivityEvent[]> {
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      returnedAt: checkouts.returnedAt,
      lendableType: lendableItems.type,
      refId: lendableItems.refId,
      bookTitle: books.title,
      movieTitle: movies.title,
      gameTitle: games.title,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(lendableItems, eq(checkouts.lendableItemId, lendableItems.id))
    .leftJoin(books, and(eq(lendableItems.type, "book"), eq(books.id, lendableItems.refId)))
    .leftJoin(movies, and(eq(lendableItems.type, "movie"), eq(movies.id, lendableItems.refId)))
    .leftJoin(games, and(eq(lendableItems.type, "game"), eq(games.id, lendableItems.refId)))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(eq(checkouts.userId, userId))
    .orderBy(desc(sql`COALESCE(${checkouts.returnedAt}, ${checkouts.checkedOutAt})`))
    .limit(limit * 2)

  function itemTitle(r: (typeof rows)[0]): string {
    if (r.lendableType === "movie") return r.movieTitle ?? ""
    if (r.lendableType === "game") return r.gameTitle ?? ""
    return r.bookTitle ?? ""
  }

  const events: ActivityEvent[] = []
  for (const r of rows) {
    events.push({
      checkoutId: r.id,
      type: "checkout",
      itemId: r.refId,
      itemType: r.lendableType as "book" | "movie" | "game",
      itemTitle: itemTitle(r),
      contactName: r.contactName,
      at: r.checkedOutAt,
    })
    if (r.returnedAt) {
      events.push({
        checkoutId: r.id,
        type: "return",
        itemId: r.refId,
        itemType: r.lendableType as "book" | "movie" | "game",
        itemTitle: itemTitle(r),
        contactName: r.contactName,
        at: r.returnedAt,
      })
    }
  }
  return events
    .sort((a, b) => {
      const dt = b.at.getTime() - a.at.getTime()
      if (dt !== 0) return dt
      return a.type === "return" ? -1 : b.type === "return" ? 1 : 0
    })
    .slice(0, limit)
}
