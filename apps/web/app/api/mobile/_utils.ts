import { auth } from "@/auth"
import type {
  MobileActivityEvent,
  MobileBook,
  MobileCheckout,
  MobileContact,
  MobileGame,
  MobileMovie,
  MobileReview,
  MobileShelfEvent,
} from "@my-shelf/types"
import { getUserForMobileToken } from "@/lib/queries/mobile-auth"

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function requireMobileUser(request?: Request): Promise<SessionUser | Response> {
  const authorization = request?.headers.get("authorization")
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null
  if (token) {
    const user = await getUserForMobileToken(token)
    if (user) return user
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

export function nullIfEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function nullableNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  if (String(value).trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function nullablePositiveInt(value: unknown): number | null {
  const parsed = nullableNumber(value)
  return parsed && parsed > 0 ? Math.trunc(parsed) : null
}

export function nullableDate(value: unknown): Date | null {
  const text = nullIfEmpty(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toMobileBook(book: {
  id: string
  userId: string
  isbn: string | null
  title: string
  authors: string | null
  seriesKey: string | null
  seriesName: string | null
  seriesPosition: number | null
  seriesTotal: number | null
  description: string | null
  coverUrl: string | null
  genre: string | null
  createdAt: Date
  lendableItemId: string | null
  isCheckedOut: boolean
}): MobileBook {
  return { ...book, createdAt: book.createdAt.toISOString() }
}

export function toMobileMovie(movie: {
  id: string
  userId: string
  title: string
  seriesName: string | null
  director: string | null
  year: number | null
  posterUrl: string | null
  format: string | null
  genre: string | null
  runtime: number | null
  description: string | null
  createdAt: Date
  lendableItemId: string | null
  isCheckedOut: boolean
}): MobileMovie {
  return { ...movie, createdAt: movie.createdAt.toISOString() }
}

export function toMobileGame(game: {
  id: string
  userId: string
  title: string
  coverUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  ageRating: string | null
  genre: string | null
  description: string | null
  createdAt: Date
  lendableItemId: string | null
  isCheckedOut: boolean
}): MobileGame {
  return { ...game, createdAt: game.createdAt.toISOString() }
}

export function toMobileContact(contact: {
  id: string
  userId: string
  name: string
  email: string | null
  phone: string | null
  linkedUserId: string | null
  createdAt: Date
}): MobileContact {
  return { ...contact, createdAt: contact.createdAt.toISOString() }
}

export function toMobileCheckout(checkout: {
  id: string
  checkedOutAt: Date
  returnedAt?: Date
  dueDate: Date | null
  notes: string | null
  item: MobileCheckout["item"]
  contact: MobileCheckout["contact"]
}): MobileCheckout {
  return {
    ...checkout,
    checkedOutAt: checkout.checkedOutAt.toISOString(),
    returnedAt: checkout.returnedAt?.toISOString(),
    dueDate: checkout.dueDate?.toISOString() ?? null,
  }
}

export function toMobileEvent(event: {
  id: string
  userId: string
  title: string
  type: "book_club" | "movie_night" | "game_night"
  startsAt: Date
  recurrence: "none" | "weekly" | "monthly"
  notes: string | null
  createdAt: Date
  items: MobileShelfEvent["items"]
}): MobileShelfEvent {
  return {
    ...event,
    startsAt: event.startsAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
  }
}

export function toMobileActivity(event: {
  checkoutId: string
  type: "checkout" | "return"
  itemId: string
  itemType: "book" | "movie" | "game"
  itemTitle: string
  contactName: string | null
  at: Date
}): MobileActivityEvent {
  return { ...event, at: event.at.toISOString() }
}

export function toMobileReview(review: {
  id: string
  lendableItemId: string
  userId: string
  rating: number
  body: string | null
  createdAt: Date
  updatedAt: Date
}): MobileReview {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  }
}
