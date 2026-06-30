import { db } from "@/lib/db"
import { contactRequests, contacts, users } from "@/lib/db/schema"
import { and, asc, eq, ne, sql } from "drizzle-orm"

export type UserSearchResult = Pick<typeof users.$inferSelect, "id" | "name" | "image">
export type UserContactCandidate = Pick<typeof users.$inferSelect, "id" | "name" | "email" | "image">

function normalizeSearchTerm(term: string) {
  return term.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")
}

export async function searchUsersByName(
  currentUserId: string,
  term: string
): Promise<UserSearchResult[]> {
  const query = normalizeSearchTerm(term)
  if (query.length < 2) return []

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(
      and(
        ne(users.id, currentUserId),
        sql`${users.name} is not null`,
        sql`${users.email} is not null`,
        sql`lower(${users.name}) like lower(${"%" + query + "%"}) escape '\\'`,
        sql`not exists (
          select 1
          from ${contacts}
          where ${contacts.userId} = ${currentUserId}
            and (
              lower(${contacts.email}) = lower(${users.email})
              or lower(${contacts.name}) = lower(${users.name})
            )
        )`,
        sql`not exists (
          select 1
          from ${contactRequests}
          where ${contactRequests.status} = 'pending'
            and (
              (${contactRequests.requesterId} = ${currentUserId} and ${contactRequests.recipientId} = ${users.id})
              or (${contactRequests.requesterId} = ${users.id} and ${contactRequests.recipientId} = ${currentUserId})
            )
        )`
      )
    )
    .orderBy(asc(users.name))
    .limit(8)

  return rows
}

export async function getUserContactCandidate(
  id: string,
  currentUserId: string
): Promise<UserContactCandidate | null> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(
      and(
        eq(users.id, id),
        ne(users.id, currentUserId),
        sql`${users.name} is not null`,
        sql`${users.email} is not null`
      )
    )
    .limit(1)

  return rows[0] ?? null
}
