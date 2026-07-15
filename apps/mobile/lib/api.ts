import type {
  ItemType,
  MobileCheckout,
  MobileCollections,
  MobileContact,
  MobileContactRequest,
  MobileDashboard,
  MobileShelfEvent,
  MobileShelfItem,
  MobileUser,
  MobileUserSearchResult,
  MobileReview,
} from "@my-shelf/types"
import { getMobileToken } from "./token-store"

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "https://hearthshelf.lonetechwiz.com"

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

export type BookSuggestion = {
  key: string
  title: string
  authors: string
  isbn: string | null
  seriesKey: string | null
  seriesName: string | null
  seriesPosition: number | null
  seriesTotal: number | null
  coverUrl: string | null
  description: string | null
}

export type MovieSuggestion = {
  imdbId: string
  title: string
  year: string
  posterUrl: string | null
}

export type MovieDetail = {
  title: string
  seriesName: string | null
  director: string | null
  year: number | null
  posterUrl: string | null
  genre: string | null
  runtime: number | null
  description: string | null
}

export type GameSuggestion = {
  bggId: string
  title: string
  year: number | null
  coverUrl?: string | null
}

export type GameDetail = {
  title: string
  coverUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  ageRating: string | null
  genre: string | null
  description: string | null
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

export function getContact(id: string) {
  return apiFetch<{ contact: MobileContact }>(`/api/mobile/contacts/${id}`)
}

export function saveContact(contact: { name: string; email: string; phone: string }, id?: string) {
  return apiFetch<{ ok: true }>(id ? `/api/mobile/contacts/${id}` : "/api/mobile/contacts", {
    method: id ? "PUT" : "POST",
    body: contact,
  })
}

export function deleteContact(id: string) {
  return apiFetch<{ ok: true }>(`/api/mobile/contacts/${id}`, { method: "DELETE" })
}

export async function getContactRequests(query = "") {
  const suffix = query.trim().length >= 2 ? `?q=${encodeURIComponent(query.trim())}` : ""
  try {
    return await apiFetch<{ requests: MobileContactRequest[]; users: MobileUserSearchResult[] }>(
      `/api/mobile/contact-requests${suffix}`
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { requests: [], users: [] }
    throw error
  }
}

export function respondToContactRequest(action: "accept" | "decline", requestId: string) {
  return apiFetch<{ ok: true }>("/api/mobile/contact-requests", {
    method: "POST",
    body: { action, requestId },
  })
}

export function requestUserContact(userId: string) {
  return apiFetch<{ ok: true }>("/api/mobile/contact-requests", {
    method: "POST",
    body: { action: "request", userId },
  })
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

export function createCheckout(data: {
  lendableItemId: string
  contactId: string | null
  dueDate: string
  notes: string
}) {
  return apiFetch<{ ok: true }>("/api/mobile/checkouts", { method: "POST", body: data })
}

export function createEvent(data: {
  title: string
  type: MobileShelfEvent["type"]
  startsAt: string
  recurrence: MobileShelfEvent["recurrence"]
  lendableItemIds: string[]
  notes: string
}) {
  return apiFetch<{ ok: true }>("/api/mobile/events", { method: "POST", body: data })
}

export function deleteEvent(id: string) {
  return apiFetch<{ ok: true }>(`/api/mobile/events/${id}`, { method: "DELETE" })
}

export function getReview(lendableItemId: string) {
  return apiFetch<{ review: MobileReview | null }>(
    `/api/mobile/reviews?lendableItemId=${encodeURIComponent(lendableItemId)}`
  )
}

export function saveReview(lendableItemId: string, rating: number, body: string) {
  return apiFetch<{ ok: true }>("/api/mobile/reviews", {
    method: "POST",
    body: { lendableItemId, rating, body },
  })
}

export function deleteReview(lendableItemId: string) {
  return apiFetch<{ ok: true }>("/api/mobile/reviews", {
    method: "POST",
    body: { action: "delete", lendableItemId },
  })
}

export function registerPushToken(expoPushToken: string, platform: string | null) {
  return apiFetch<{ ok: true }>("/api/mobile/push", {
    method: "POST",
    body: { expoPushToken, platform },
  })
}

export function unregisterPushToken(expoPushToken: string) {
  return apiFetch<{ ok: true }>("/api/mobile/push", {
    method: "POST",
    body: { action: "delete", expoPushToken },
  })
}

export function lookupBookByIsbn(isbn: string) {
  return apiFetch<{ suggestion: BookSuggestion | null }>(
    `/api/mobile/search/books?isbn=${encodeURIComponent(isbn)}`
  )
}

export function searchBooksByTitle(title: string) {
  return apiFetch<{ suggestions: BookSuggestion[] }>(
    `/api/mobile/search/books?title=${encodeURIComponent(title)}`
  ).then(({ suggestions }) => suggestions)
}

export async function searchMoviesByTitle(title: string): Promise<MovieSuggestion[]> {
  const data = await apiFetch<{
    Response?: string
    Search?: Array<{ imdbID: string; Title: string; Year: string; Poster: string }>
  }>(`/api/omdb?s=${encodeURIComponent(title)}`)
  if (data.Response === "False" || !data.Search) return []
  return data.Search.map((item) => ({
    imdbId: item.imdbID,
    title: item.Title,
    year: item.Year,
    posterUrl: item.Poster !== "N/A" ? item.Poster : null,
  }))
}

export async function getMovieByImdbId(imdbId: string): Promise<MovieDetail | null> {
  const data = await apiFetch<Record<string, string>>(`/api/omdb?i=${encodeURIComponent(imdbId)}`)
  if (data.Response === "False") return null
  const runtimeMatch = data.Runtime?.match(/^(\d+)/)
  return {
    title: data.Title ?? "",
    seriesName: inferMovieSeriesName(data.Title ?? ""),
    director: data.Director && data.Director !== "N/A" ? data.Director : null,
    year: data.Year ? Number.parseInt(data.Year, 10) || null : null,
    posterUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
    genre: data.Genre && data.Genre !== "N/A" ? data.Genre : null,
    runtime: runtimeMatch ? Number.parseInt(runtimeMatch[1], 10) : null,
    description: data.Plot && data.Plot !== "N/A" ? data.Plot : null,
  }
}

export function searchGamesByTitle(title: string) {
  return apiFetch<GameSuggestion[]>(`/api/bgg?query=${encodeURIComponent(title)}`)
}

export function getGameByBggId(bggId: string) {
  return apiFetch<GameDetail | null>(`/api/bgg?id=${encodeURIComponent(bggId)}`)
}

function inferMovieSeriesName(title: string): string | null {
  const normalized = title.trim().replace(/\s+/g, " ")
  if (!normalized) return null
  const episodeMatch = normalized.match(/^(.+?):\s*episode\s+[ivxlcdm0-9]+\b/i)
  if (episodeMatch?.[1]) return episodeMatch[1].trim()
  const dashIndex = normalized.indexOf(" - ")
  if (dashIndex > 0) return normalized.slice(0, dashIndex).trim()
  const colonIndex = normalized.indexOf(":")
  return colonIndex > 0 ? normalized.slice(0, colonIndex).trim() : null
}
