import {
  deleteItemReview,
  getReviewForItem,
  upsertItemReview,
} from "@/lib/queries/reviews"
import {
  jsonError,
  nullIfEmpty,
  requireMobileUser,
  toMobileReview,
} from "@/app/api/mobile/_utils"

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const { searchParams } = new URL(request.url)
  const lendableItemId = nullIfEmpty(searchParams.get("lendableItemId"))
  if (!lendableItemId) return jsonError("Item is required")

  const review = await getReviewForItem(lendableItemId, user.id)
  return Response.json({ review: review ? toMobileReview(review) : null })
}

export async function POST(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const lendableItemId = nullIfEmpty(body.lendableItemId)
  if (!lendableItemId) return jsonError("Item is required")

  if (nullIfEmpty(body.action) === "delete") {
    const deleted = await deleteItemReview(user.id, lendableItemId)
    return deleted ? Response.json({ ok: true }) : jsonError("Item not found", 404)
  }

  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return jsonError("Rating must be between 1 and 5")
  }

  const saved = await upsertItemReview(user.id, {
    lendableItemId,
    rating,
    body: nullIfEmpty(body.body),
  })

  return saved ? Response.json({ ok: true }) : jsonError("Item not found", 404)
}
