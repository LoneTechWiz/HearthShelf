import { db } from "@/lib/db"
import { books, checkouts, contacts } from "@/lib/db/schema"
import { and, count, desc, eq, isNull, lt, sql } from "drizzle-orm"

export type DashboardStats = {
  totalBooks: number
  checkedOutNow: number
  overdue: number
  totalContacts: number
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [[bookCount], [activeCount], [overdueCount], [contactCount]] = await Promise.all([
    db.select({ value: count() }).from(books).where(eq(books.userId, userId)),
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
    checkedOutNow: activeCount.value,
    overdue: overdueCount.value,
    totalContacts: contactCount.value,
  }
}

export type ActivityEvent = {
  checkoutId: string
  type: "checkout" | "return"
  bookId: string
  bookTitle: string
  contactName: string | null
  at: Date
}

export async function getRecentActivity(userId: string, limit = 5): Promise<ActivityEvent[]> {
  // Order by the latest event on each checkout (return beats checkout when present)
  // so old checkouts that were just returned still surface.
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      returnedAt: checkouts.returnedAt,
      bookId: books.id,
      bookTitle: books.title,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(books, eq(checkouts.bookId, books.id))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(eq(checkouts.userId, userId))
    .orderBy(desc(sql`COALESCE(${checkouts.returnedAt}, ${checkouts.checkedOutAt})`))
    .limit(limit)

  const events: ActivityEvent[] = []
  for (const r of rows) {
    events.push({
      checkoutId: r.id,
      type: "checkout",
      bookId: r.bookId,
      bookTitle: r.bookTitle,
      contactName: r.contactName,
      at: r.checkedOutAt,
    })
    if (r.returnedAt) {
      events.push({
        checkoutId: r.id,
        type: "return",
        bookId: r.bookId,
        bookTitle: r.bookTitle,
        contactName: r.contactName,
        at: r.returnedAt,
      })
    }
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}
