import { deleteEventRecord, updateEventRecord, type EventRecurrence, type EventType } from "@/lib/queries/events"
import {
  jsonError,
  nullableDate,
  nullIfEmpty,
  requireMobileUser,
} from "@/app/api/mobile/_utils"

type Params = { params: Promise<{ id: string }> }

function eventType(value: unknown): EventType | null {
  return value === "book_club" || value === "movie_night" || value === "game_night"
    ? value
    : null
}

function recurrence(value: unknown): EventRecurrence {
  return value === "weekly" || value === "monthly" ? value : "none"
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => nullIfEmpty(item)).filter((item): item is string => item !== null)))
    : []
}

export async function PUT(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const title = nullIfEmpty(body.title)
  if (!title) return jsonError("Title is required")
  const type = eventType(body.type)
  if (!type) return jsonError("Event type is required")
  const startsAt = nullableDate(body.startsAt)
  if (!startsAt) return jsonError("Date and time are required")

  const saved = await updateEventRecord((await params).id, user.id, {
    title,
    type,
    startsAt,
    recurrence: recurrence(body.recurrence),
    lendableItemIds: stringArray(body.lendableItemIds),
    notes: nullIfEmpty(body.notes),
  })

  return saved ? Response.json({ ok: true }) : jsonError("Selected item was not found", 404)
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  await deleteEventRecord((await params).id, user.id)
  return Response.json({ ok: true })
}
