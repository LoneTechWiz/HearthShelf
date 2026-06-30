import { db } from "@/lib/db"
import { itemReviews, lendableItems } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export type ItemReview = typeof itemReviews.$inferSelect

export async function getReviewForItem(
  lendableItemId: string,
  userId: string
): Promise<ItemReview | null> {
  const rows = await db
    .select()
    .from(itemReviews)
    .where(and(eq(itemReviews.lendableItemId, lendableItemId), eq(itemReviews.userId, userId)))
    .limit(1)

  return rows[0] ?? null
}

export async function upsertItemReview(
  userId: string,
  data: { lendableItemId: string; rating: number; body: string | null }
): Promise<boolean> {
  const item = await db
    .select({ id: lendableItems.id })
    .from(lendableItems)
    .where(and(eq(lendableItems.id, data.lendableItemId), eq(lendableItems.userId, userId)))
    .limit(1)

  if (!item[0]) return false

  await db
    .insert(itemReviews)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: [itemReviews.userId, itemReviews.lendableItemId],
      set: {
        rating: data.rating,
        body: data.body,
        updatedAt: new Date(),
      },
    })

  return true
}

export async function deleteItemReview(
  userId: string,
  lendableItemId: string
): Promise<boolean> {
  const item = await db
    .select({ id: lendableItems.id })
    .from(lendableItems)
    .where(and(eq(lendableItems.id, lendableItemId), eq(lendableItems.userId, userId)))
    .limit(1)

  if (!item[0]) return false

  await db
    .delete(itemReviews)
    .where(and(eq(itemReviews.lendableItemId, lendableItemId), eq(itemReviews.userId, userId)))

  return true
}
