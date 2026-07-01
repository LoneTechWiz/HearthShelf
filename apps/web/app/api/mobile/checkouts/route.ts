import {
  createCheckoutRecord,
  getActiveCheckouts,
  getCheckoutHistory,
  returnItemRecord,
} from "@/lib/queries/checkouts"
import {
  jsonError,
  nullableDate,
  nullIfEmpty,
  requireMobileUser,
  toMobileCheckout,
} from "@/app/api/mobile/_utils"

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const [active, history] = await Promise.all([
    getActiveCheckouts(user.id),
    getCheckoutHistory(user.id),
  ])

  return Response.json({
    active: active.map(toMobileCheckout),
    history: history.map(toMobileCheckout),
  })
}

export async function POST(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const action = nullIfEmpty(body.action)
  if (action === "return") {
    const checkoutId = nullIfEmpty(body.checkoutId)
    if (!checkoutId) return jsonError("Checkout is required")
    await returnItemRecord(checkoutId, user.id)
    return Response.json({ ok: true })
  }

  const lendableItemId = nullIfEmpty(body.lendableItemId)
  if (!lendableItemId) return jsonError("Item is required")

  await createCheckoutRecord(user.id, {
    lendableItemId,
    contactId: nullIfEmpty(body.contactId),
    dueDate: nullableDate(body.dueDate),
    notes: nullIfEmpty(body.notes),
  })

  return Response.json({ ok: true }, { status: 201 })
}
