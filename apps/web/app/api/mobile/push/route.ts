import {
  deleteMobilePushSubscription,
  upsertMobilePushSubscription,
} from "@/lib/queries/mobile-push-subscriptions"
import {
  jsonError,
  nullIfEmpty,
  requireMobileUser,
} from "@/app/api/mobile/_utils"

export async function POST(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const expoPushToken = nullIfEmpty(body.expoPushToken)
  if (!expoPushToken) return jsonError("Expo push token is required")

  if (nullIfEmpty(body.action) === "delete") {
    await deleteMobilePushSubscription(user.id, expoPushToken)
    return Response.json({ ok: true })
  }

  await upsertMobilePushSubscription(user.id, {
    expoPushToken,
    platform: nullIfEmpty(body.platform),
    deviceName: nullIfEmpty(body.deviceName),
  })

  return Response.json({ ok: true })
}
