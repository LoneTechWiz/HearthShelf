import { auth } from "@/auth"
import { deletePushSubscription } from "@/lib/queries/push-subscriptions"

type UnsubscribeBody = {
  endpoint?: unknown
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as UnsubscribeBody
  if (typeof body.endpoint !== "string") {
    return Response.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await deletePushSubscription(session.user.id, body.endpoint)

  return Response.json({ ok: true })
}
