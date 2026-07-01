"use client"

import { useEffect, useState } from "react"
import { btnSecondary } from "@/components/ui/classes"

type PushState = "unsupported" | "disabled" | "enabled" | "blocked" | "loading"
const AUTO_PROMPT_KEY = "hearthshelf-push-auto-prompted"

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/push-sw.js")
  return existing ?? navigator.serviceWorker.register("/push-sw.js")
}

function pushIsSupported(publicKey: string | null): boolean {
  return Boolean(
    publicKey &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
  )
}

async function subscribeToPush(publicKey: string): Promise<"enabled" | "disabled" | "blocked"> {
  const permission = await Notification.requestPermission()
  if (permission === "denied") return "blocked"
  if (permission !== "granted") return "disabled"

  const registration = await getRegistration()
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(publicKey),
    }))

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  })

  return "enabled"
}

export function PushNotificationAutoPrompt({ publicKey }: { publicKey: string | null }) {
  useEffect(() => {
    if (!pushIsSupported(publicKey)) return
    if (Notification.permission !== "default") return
    if (window.localStorage.getItem(AUTO_PROMPT_KEY)) return

    async function promptForNotifications() {
      removeListeners()
      window.localStorage.setItem(AUTO_PROMPT_KEY, "1")

      try {
        await subscribeToPush(publicKey!)
      } catch (error) {
        console.warn("Unable to enable push notifications", error)
      }
    }

    function removeListeners() {
      window.removeEventListener("pointerdown", promptForNotifications)
      window.removeEventListener("keydown", promptForNotifications)
      window.removeEventListener("touchstart", promptForNotifications)
    }

    window.addEventListener("pointerdown", promptForNotifications, { once: true })
    window.addEventListener("keydown", promptForNotifications, { once: true })
    window.addEventListener("touchstart", promptForNotifications, { once: true })

    return removeListeners
  }, [publicKey])

  return null
}

export function PushNotificationToggle({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<PushState>("loading")

  useEffect(() => {
    let mounted = true

    async function checkSubscription() {
      if (!pushIsSupported(publicKey)) {
        if (mounted) setState("unsupported")
        return
      }

      if (Notification.permission === "denied") {
        if (mounted) setState("blocked")
        return
      }

      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js")
      const subscription = await registration?.pushManager.getSubscription()
      if (mounted) setState(subscription ? "enabled" : "disabled")
    }

    checkSubscription()

    return () => {
      mounted = false
    }
  }, [publicKey])

  async function enable() {
    if (!publicKey) return
    setState("loading")

    setState(await subscribeToPush(publicKey))
  }

  async function disable() {
    setState("loading")
    const registration = await navigator.serviceWorker.getRegistration("/push-sw.js")
    const subscription = await registration?.pushManager.getSubscription()

    if (subscription) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })
      await subscription.unsubscribe()
    }

    setState("disabled")
  }

  if (state === "unsupported") {
    return (
      <p className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink-muted">
        Push notifications are not available in this browser.
      </p>
    )
  }

  if (state === "blocked") {
    return (
      <p className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink-muted">
        Push notifications are blocked in your browser settings.
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={state === "enabled" ? disable : enable}
      disabled={state === "loading"}
      className={btnSecondary}
    >
      {state === "enabled" ? "Turn Off Push" : "Turn On Push"}
    </button>
  )
}
