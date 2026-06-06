import { db } from "@/lib/db"
import { books, checkouts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"

export type BookRow = typeof books.$inferSelect

export type BookWithAvailability = BookRow & { isCheckedOut: boolean }

export async function getBooksForUser(userId: string): Promise<BookWithAvailability[]> {
  const rows = await db
    .select({
      id: books.id,
      userId: books.userId,
      isbn: books.isbn,
      title: books.title,
      authors: books.authors,
      description: books.description,
      coverUrl: books.coverUrl,
      createdAt: books.createdAt,
      activeCheckoutId: checkouts.id,
    })
    .from(books)
    .leftJoin(
      checkouts,
      and(eq(checkouts.bookId, books.id), isNull(checkouts.returnedAt))
    )
    .where(eq(books.userId, userId))
    .orderBy(desc(books.createdAt))

  return rows.map(({ activeCheckoutId, ...book }) => ({
    ...book,
    isCheckedOut: activeCheckoutId !== null,
  }))
}

export async function getBookById(
  id: string,
  userId: string
): Promise<BookRow | null> {
  const rows = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function createBookRecord(
  userId: string,
  data: { title: string; authors: string | null; isbn: string | null; description: string | null; coverUrl: string | null }
): Promise<void> {
  await db.insert(books).values({ userId, ...data })
}

export async function updateBookRecord(
  id: string,
  userId: string,
  data: { title: string; authors: string | null; isbn: string | null; description: string | null; coverUrl: string | null }
): Promise<void> {
  await db
    .update(books)
    .set(data)
    .where(and(eq(books.id, id), eq(books.userId, userId)))
}

export async function deleteBookRecord(id: string, userId: string): Promise<void> {
  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, userId)))
}
