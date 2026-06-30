import { db } from "@/lib/db"
import { contactRequests, users } from "@/lib/db/schema"
import { and, desc, eq, or } from "drizzle-orm"

export type IncomingContactRequest = {
  id: string
  requester: {
    id: string
    name: string
    email: string
    image: string | null
  }
  createdAt: Date
}

export async function createContactRequest(
  requesterId: string,
  recipientId: string
): Promise<void> {
  await db
    .insert(contactRequests)
    .values({ requesterId, recipientId, status: "pending" })
    .onConflictDoUpdate({
      target: [contactRequests.requesterId, contactRequests.recipientId],
      set: { status: "pending", respondedAt: null },
    })
}

export async function getPendingRequestBetweenUsers(
  userId: string,
  otherUserId: string
): Promise<typeof contactRequests.$inferSelect | null> {
  const rows = await db
    .select()
    .from(contactRequests)
    .where(
      and(
        eq(contactRequests.status, "pending"),
        or(
          and(
            eq(contactRequests.requesterId, userId),
            eq(contactRequests.recipientId, otherUserId)
          ),
          and(
            eq(contactRequests.requesterId, otherUserId),
            eq(contactRequests.recipientId, userId)
          )
        )
      )
    )
    .limit(1)

  return rows[0] ?? null
}

export async function getIncomingContactRequests(userId: string): Promise<IncomingContactRequest[]> {
  const rows = await db
    .select({
      id: contactRequests.id,
      createdAt: contactRequests.createdAt,
      requesterId: users.id,
      requesterName: users.name,
      requesterEmail: users.email,
      requesterImage: users.image,
    })
    .from(contactRequests)
    .innerJoin(users, eq(contactRequests.requesterId, users.id))
    .where(and(eq(contactRequests.recipientId, userId), eq(contactRequests.status, "pending")))
    .orderBy(desc(contactRequests.createdAt))

  return rows
    .filter((row) => row.requesterName && row.requesterEmail)
    .map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      requester: {
        id: row.requesterId,
        name: row.requesterName!,
        email: row.requesterEmail!,
        image: row.requesterImage,
      },
    }))
}

export async function getPendingIncomingContactRequest(
  requestId: string,
  recipientId: string
): Promise<IncomingContactRequest | null> {
  const rows = await db
    .select({
      id: contactRequests.id,
      createdAt: contactRequests.createdAt,
      requesterId: users.id,
      requesterName: users.name,
      requesterEmail: users.email,
      requesterImage: users.image,
    })
    .from(contactRequests)
    .innerJoin(users, eq(contactRequests.requesterId, users.id))
    .where(
      and(
        eq(contactRequests.id, requestId),
        eq(contactRequests.recipientId, recipientId),
        eq(contactRequests.status, "pending")
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row?.requesterName || !row.requesterEmail) return null

  return {
    id: row.id,
    createdAt: row.createdAt,
    requester: {
      id: row.requesterId,
      name: row.requesterName,
      email: row.requesterEmail,
      image: row.requesterImage,
    },
  }
}

export async function updateContactRequestStatus(
  requestId: string,
  recipientId: string,
  status: "accepted" | "declined"
): Promise<void> {
  await db
    .update(contactRequests)
    .set({ status, respondedAt: new Date() })
    .where(
      and(
        eq(contactRequests.id, requestId),
        eq(contactRequests.recipientId, recipientId),
        eq(contactRequests.status, "pending")
      )
    )
}
