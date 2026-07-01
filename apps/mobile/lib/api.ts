import type {
  ItemType,
  MobileCheckout,
  MobileCollections,
  MobileContact,
  MobileDashboard,
  MobileShelfEvent,
  MobileShelfItem,
  MobileUser,
} from "@my-shelf/types"
import { getMobileToken } from "./token-store"

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = await getMobileToken()
  const headers: Record<string, string> = { Accept: "application/json" }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Request failed", response.status)
  }
  return payload as T
}

export function getMe() {
  return apiFetch<{ user: MobileUser }>("/api/mobile/me")
}

export function exchangeAuthCode(code: string, redirectUri: string) {
  return apiFetch<{ token: string; expiresAt: string }>("/api/mobile/auth/exchange", {
    method: "POST",
    body: { code, redirectUri },
  })
}

export function revokeSession() {
  return apiFetch<{ ok: true }>("/api/mobile/auth/revoke", { method: "POST" })
}

export function getDashboard() {
  return apiFetch<MobileDashboard>("/api/mobile/dashboard")
}

export function getItems(type: ItemType) {
  return apiFetch<{ items: MobileShelfItem[] }>(`/api/mobile/items/${type}`)
}

export function getItem(type: ItemType, id: string) {
  return apiFetch<{ item: MobileShelfItem }>(`/api/mobile/items/${type}/${id}`)
}

export function getCollections() {
  return apiFetch<MobileCollections>("/api/mobile/collections")
}

export function getContacts() {
  return apiFetch<{ contacts: MobileContact[] }>("/api/mobile/contacts")
}

export function getCheckouts() {
  return apiFetch<{ active: MobileCheckout[]; history: MobileCheckout[] }>(
    "/api/mobile/checkouts"
  )
}

export function getEvents() {
  return apiFetch<{ events: MobileShelfEvent[] }>("/api/mobile/events")
}

export function saveItem(type: ItemType, item: Record<string, unknown>, id?: string) {
  return apiFetch<{ ok: true }>(id ? `/api/mobile/items/${type}/${id}` : `/api/mobile/items/${type}`, {
    method: id ? "PUT" : "POST",
    body: item,
  })
}

export function deleteItem(type: ItemType, id: string) {
  return apiFetch<{ ok: true }>(`/api/mobile/items/${type}/${id}`, { method: "DELETE" })
}

export function returnCheckout(checkoutId: string) {
  return apiFetch<{ ok: true }>("/api/mobile/checkouts", {
    method: "POST",
    body: { action: "return", checkoutId },
  })
}

export function registerPushToken(expoPushToken: string, platform: string | null) {
  return apiFetch<{ ok: true }>("/api/mobile/push", {
    method: "POST",
    body: { expoPushToken, platform },
  })
}

export function lookupBookByIsbn(isbn: string) {
  return apiFetch<{
    suggestion: {
      title: string
      authors: string
      isbn: string | null
      seriesKey: string | null
      seriesName: string | null
      seriesPosition: number | null
      seriesTotal: number | null
      coverUrl: string | null
      description: string | null
    } | null
  }>(`/api/mobile/search/books?isbn=${encodeURIComponent(isbn)}`)
}
