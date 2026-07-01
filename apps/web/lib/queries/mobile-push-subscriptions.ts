import { db } from "@/lib/db"
import { mobilePushSubscriptions } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function upsertMobilePushSubscription(
  userId: string,
  data: { expoPushToken: string; platform: string | null; deviceName: string | null }
): Promise<void> {
  await db
    .insert(mobilePushSubscriptions)
    .values({ userId, ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: mobilePushSubscriptions.expoPushToken,
      set: {
        userId,
        platform: data.platform,
        deviceName: data.deviceName,
        updatedAt: new Date(),
      },
    })
}

export async function deleteMobilePushSubscription(
  userId: string,
  expoPushToken: string
): Promise<void> {
  await db
    .delete(mobilePushSubscriptions)
    .where(
      and(
        eq(mobilePushSubscriptions.userId, userId),
        eq(mobilePushSubscriptions.expoPushToken, expoPushToken)
      )
    )
}
