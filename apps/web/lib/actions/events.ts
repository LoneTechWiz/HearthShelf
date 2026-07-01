"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createEventRecord, deleteEventRecord, type EventRecurrence, type EventType } from "@/lib/queries/events"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

function parseEventType(val: FormDataEntryValue | null): EventType | null {
  const value = String(val ?? "")
  return value === "book_club" || value === "movie_night" || value === "game_night" ? value : null
}

function parseRecurrence(val: FormDataEntryValue | null): EventRecurrence {
  const value = String(val ?? "")
  return value === "weekly" || value === "monthly" ? value : "none"
}

function parseStartsAt(val: FormDataEntryValue | null): Date | null {
  const text = nullIfEmpty(val)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseLendableItemIds(formData: FormData): string[] {
  return Array.from(
    new Set(
      formData
        .getAll("lendableItemIds")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  )
}

export async function createEvent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  const type = parseEventType(formData.get("type"))
  if (!type) return { error: "Event type is required" }

  const startsAt = parseStartsAt(formData.get("startsAt"))
  if (!startsAt) return { error: "Date and time are required" }

  const saved = await createEventRecord(session.user.id, {
    title,
    type,
    startsAt,
    recurrence: parseRecurrence(formData.get("recurrence")),
    lendableItemIds: parseLendableItemIds(formData),
    notes: nullIfEmpty(formData.get("notes")),
  })
  if (!saved) return { error: "Selected item was not found" }

  revalidatePath("/events")
  redirect("/events?flash=Event%20created")
  return null
}

export async function deleteEvent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing event id" }

  await deleteEventRecord(id, session.user.id)
  revalidatePath("/events")
  redirect("/events?flash=Event%20deleted")
  return null
}
