import { db } from "@/lib/db"
import { webPushSubscriptions } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export type PushSubscriptionRecord = typeof webPushSubscriptions.$inferSelect

export type PushSubscriptionInput = {
  endpoint: string
  p256dh: string
  auth: string
  userAgent: string | null
}

export async function upsertPushSubscription(
  userId: string,
  data: PushSubscriptionInput
): Promise<void> {
  await db
    .insert(webPushSubscriptions)
    .values({
      userId,
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
      userAgent: data.userAgent,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: webPushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        updatedAt: new Date(),
      },
    })
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await db
    .delete(webPushSubscriptions)
    .where(and(eq(webPushSubscriptions.userId, userId), eq(webPushSubscriptions.endpoint, endpoint)))
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await db.delete(webPushSubscriptions).where(eq(webPushSubscriptions.endpoint, endpoint))
}

export async function getPushSubscriptionsForUser(
  userId: string
): Promise<PushSubscriptionRecord[]> {
  return db
    .select()
    .from(webPushSubscriptions)
    .where(eq(webPushSubscriptions.userId, userId))
}
