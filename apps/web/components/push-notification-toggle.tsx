"use client"

import { useEffect, useState } from "react"
import { btnSecondary } from "@/components/ui/classes"

type PushState = "unsupported" | "disabled" | "enabled" | "blocked" | "loading"

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

export function PushNotificationToggle({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<PushState>("loading")

  useEffect(() => {
    let mounted = true

    async function checkSubscription() {
      if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
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

    const permission = await Notification.requestPermission()
    if (permission === "denied") {
      setState("blocked")
      return
    }
    if (permission !== "granted") {
      setState("disabled")
      return
    }

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

    setState("enabled")
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
