import webPush from "web-push"
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsForUser,
  type PushSubscriptionRecord,
} from "@/lib/queries/push-subscriptions"

type PushPayload = {
  title: string
  body: string
  url: string
}

type WebPushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

let configured = false

export function getWebPushPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? null
}

function configureWebPush(): boolean {
  if (configured) return true

  const publicKey = getWebPushPublicKey()
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
  const subject = process.env.WEB_PUSH_SUBJECT ?? "mailto:support@hearthshelf.app"
  if (!publicKey || !privateKey) return false

  webPush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

function toWebPushSubscription(subscription: PushSubscriptionRecord): WebPushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!configureWebPush()) return

  const subscriptions = await getPushSubscriptionsForUser(userId)
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          toWebPushSubscription(subscription),
          JSON.stringify(payload)
        )
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? error.statusCode
            : null
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(subscription.endpoint)
        }
      }
    })
  )
}
