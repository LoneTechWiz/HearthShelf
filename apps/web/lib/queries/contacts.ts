import { db } from "@/lib/db"
import { contacts } from "@/lib/db/schema"
import { and, asc, eq } from "drizzle-orm"

export type ContactRow = typeof contacts.$inferSelect

export async function getContactsForUser(userId: string): Promise<ContactRow[]> {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(asc(contacts.name))
}

export async function getContactById(
  id: string,
  userId: string
): Promise<ContactRow | null> {
  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function createContactRecord(
  userId: string,
  data: { name: string; email: string | null; phone: string | null }
): Promise<void> {
  await db.insert(contacts).values({ userId, ...data })
}

export async function updateContactRecord(
  id: string,
  userId: string,
  data: { name: string; email: string | null; phone: string | null }
): Promise<void> {
  await db
    .update(contacts)
    .set(data)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
}

export async function deleteContactRecord(id: string, userId: string): Promise<void> {
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
}
