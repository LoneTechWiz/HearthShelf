import { auth } from "@/auth"
import { upsertPushSubscription } from "@/lib/queries/push-subscriptions"

type SubscriptionBody = {
  endpoint?: unknown
  keys?: {
    p256dh?: unknown
    auth?: unknown
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as SubscriptionBody
  if (
    typeof body.endpoint !== "string" ||
    typeof body.keys?.p256dh !== "string" ||
    typeof body.keys.auth !== "string"
  ) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await upsertPushSubscription(session.user.id, {
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    userAgent: request.headers.get("user-agent"),
  })

  return Response.json({ ok: true })
}
