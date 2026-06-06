import { db } from "@/lib/db"
import { books, checkouts, contacts } from "@/lib/db/schema"
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm"

export type ActiveCheckout = {
  id: string
  checkedOutAt: Date
  dueDate: Date | null
  notes: string | null
  book: { id: string; title: string; authors: string | null; coverUrl: string | null }
  contact: { id: string; name: string } | null
}

export type CheckoutHistory = ActiveCheckout & { returnedAt: Date }

export async function getActiveCheckouts(userId: string): Promise<ActiveCheckout[]> {
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      dueDate: checkouts.dueDate,
      notes: checkouts.notes,
      bookId: books.id,
      bookTitle: books.title,
      bookAuthors: books.authors,
      bookCoverUrl: books.coverUrl,
      contactId: contacts.id,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(books, eq(checkouts.bookId, books.id))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(and(eq(checkouts.userId, userId), isNull(checkouts.returnedAt)))
    .orderBy(desc(checkouts.checkedOutAt))

  return rows.map((r) => ({
    id: r.id,
    checkedOutAt: r.checkedOutAt,
    dueDate: r.dueDate,
    notes: r.notes,
    book: { id: r.bookId, title: r.bookTitle, authors: r.bookAuthors, coverUrl: r.bookCoverUrl },
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
      bookId: books.id,
      bookTitle: books.title,
      bookAuthors: books.authors,
      bookCoverUrl: books.coverUrl,
      contactId: contacts.id,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(books, eq(checkouts.bookId, books.id))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(and(eq(checkouts.userId, userId), isNotNull(checkouts.returnedAt)))
    .orderBy(desc(checkouts.returnedAt))

  return rows.map((r) => ({
    id: r.id,
    checkedOutAt: r.checkedOutAt,
    returnedAt: r.returnedAt!,
    dueDate: r.dueDate,
    notes: r.notes,
    book: { id: r.bookId, title: r.bookTitle, authors: r.bookAuthors, coverUrl: r.bookCoverUrl },
    contact: r.contactId ? { id: r.contactId, name: r.contactName! } : null,
  }))
}

export async function createCheckoutRecord(
  userId: string,
  data: { bookId: string; contactId: string | null; dueDate: Date | null; notes: string | null }
): Promise<void> {
  await db.insert(checkouts).values({ userId, ...data })
}

export async function returnBookRecord(checkoutId: string, userId: string): Promise<void> {
  await db
    .update(checkouts)
    .set({ returnedAt: new Date() })
    .where(and(eq(checkouts.id, checkoutId), eq(checkouts.userId, userId)))
}
