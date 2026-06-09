import { db } from "@/lib/db"
import { books, checkouts } from "@/lib/db/schema"
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"

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
): Promise<BookWithAvailability | null> {
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
    .where(and(eq(books.id, id), eq(books.userId, userId)))
    .limit(1)

  if (!rows[0]) return null
  const { activeCheckoutId, ...book } = rows[0]
  return { ...book, isCheckedOut: activeCheckoutId !== null }
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

type BookData = {
  title: string
  authors: string | null
  isbn: string | null
  description: string | null
  coverUrl: string | null
}

// Finds an existing book for upsert. Matches on ISBN when the row has one;
// otherwise on case-insensitive title + authors (null authors matched as null).
export async function findBookMatch(
  userId: string,
  row: { title: string; authors: string | null; isbn: string | null }
): Promise<BookRow | null> {
  if (row.isbn) {
    const rows = await db
      .select()
      .from(books)
      .where(and(eq(books.userId, userId), eq(books.isbn, row.isbn)))
      .limit(1)
    return rows[0] ?? null
  }

  const rows = await db
    .select()
    .from(books)
    .where(
      and(
        eq(books.userId, userId),
        sql`lower(${books.title}) = lower(${row.title})`,
        row.authors === null
          ? isNull(books.authors)
          : sql`lower(${books.authors}) = lower(${row.authors})`
      )
    )
    .limit(1)
  return rows[0] ?? null
}

export async function createBookRecordReturningId(
  userId: string,
  data: BookData
): Promise<string> {
  const [row] = await db
    .insert(books)
    .values({ userId, ...data })
    .returning({ id: books.id })
  return row.id
}

export async function getBooksByIds(
  userId: string,
  ids: string[]
): Promise<BookRow[]> {
  if (ids.length === 0) return []
  return db
    .select()
    .from(books)
    .where(and(eq(books.userId, userId), inArray(books.id, ids)))
    .orderBy(desc(books.createdAt))
}
