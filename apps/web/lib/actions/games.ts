"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createGameRecord,
  createGameRecordReturningId,
  deleteGameRecord,
  findGameMatch,
  updateGameRecord,
} from "@/lib/queries/games"
import { parseCsv, toRecords } from "@/lib/csv/parse"
import type { ImportResult, ImportSkip } from "@/lib/csv/types"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

function nullableInt(val: FormDataEntryValue | null): number | null {
  const s = nullIfEmpty(val)
  if (!s) return null
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

export async function createGame(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await createGameRecord(session.user.id, {
    title,
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
    minPlayers: nullableInt(formData.get("minPlayers")),
    maxPlayers: nullableInt(formData.get("maxPlayers")),
    ageRating: nullIfEmpty(formData.get("ageRating")),
    genre: nullIfEmpty(formData.get("genre")),
    description: nullIfEmpty(formData.get("description")),
  })

  revalidatePath("/games")
  redirect("/games?flash=Game added")
  return null
}

export async function deleteGame(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing game id" }
  await deleteGameRecord(id, session.user.id)

  revalidatePath("/games")
  redirect("/games?flash=Game deleted")
  return null
}

export async function updateGame(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing game id" }
  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await updateGameRecord(id, session.user.id, {
    title,
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
    minPlayers: nullableInt(formData.get("minPlayers")),
    maxPlayers: nullableInt(formData.get("maxPlayers")),
    ageRating: nullIfEmpty(formData.get("ageRating")),
    genre: nullIfEmpty(formData.get("genre")),
    description: nullIfEmpty(formData.get("description")),
  })

  revalidatePath(`/games/${id}`)
  revalidatePath("/games")
  redirect(`/games/${id}?flash=Game updated`)
  return null
}

const GAME_COLUMNS = ["title", "coverUrl", "minPlayers", "maxPlayers", "ageRating", "genre", "description"] as const

export async function importGames(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  const text = String(formData.get("csv") ?? "")
  if (text.trim() === "") return { error: "The file is empty" }

  const { records, missingColumns } = toRecords(parseCsv(text), GAME_COLUMNS)
  if (missingColumns.includes("title")) {
    return { error: 'CSV is missing a required "title" column' }
  }

  let created = 0
  let updated = 0
  const skipped: ImportSkip[] = []
  const importedIds: string[] = []

  for (const { line, values } of records) {
    const title = values.title
    if (!title) {
      skipped.push({ line, reason: "Missing title" })
      continue
    }
    const minPlayers = values.minPlayers ? parseInt(values.minPlayers, 10) : null
    const maxPlayers = values.maxPlayers ? parseInt(values.maxPlayers, 10) : null
    const data = {
      title,
      coverUrl: values.coverUrl ?? null,
      minPlayers: isNaN(minPlayers!) ? null : minPlayers,
      maxPlayers: isNaN(maxPlayers!) ? null : maxPlayers,
      ageRating: values.ageRating ?? null,
      genre: values.genre ?? null,
      description: values.description ?? null,
    }

    try {
      const existing = await findGameMatch(userId, { title })
      if (existing) {
        await updateGameRecord(existing.id, userId, {
          title,
          coverUrl: data.coverUrl ?? existing.coverUrl,
          minPlayers: data.minPlayers ?? existing.minPlayers,
          maxPlayers: data.maxPlayers ?? existing.maxPlayers,
          ageRating: data.ageRating ?? existing.ageRating,
          genre: data.genre ?? existing.genre,
          description: data.description ?? existing.description,
        })
        updated++
        importedIds.push(existing.id)
      } else {
        const id = await createGameRecordReturningId(userId, data)
        created++
        importedIds.push(id)
      }
    } catch {
      skipped.push({ line, reason: "Database error" })
    }
  }

  revalidatePath("/games")
  return { created, updated, skipped, importedIds }
}

type BulkEditRow = {
  id: string
  title: string
  coverUrl: string
  minPlayers: string
  maxPlayers: string
  ageRating: string
  genre: string
  description: string
}

export async function bulkUpdateGames(
  _prevState: { updated: number } | { error: string } | null,
  formData: FormData
): Promise<{ updated: number } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  let rows: BulkEditRow[]
  try {
    const parsed = JSON.parse(String(formData.get("rows") ?? "[]"))
    if (!Array.isArray(parsed)) return { error: "Invalid data" }
    rows = parsed
  } catch {
    return { error: "Invalid data" }
  }

  let updated = 0
  for (const row of rows) {
    if (!row.id || !row.title?.trim()) continue
    const minPlayers = row.minPlayers ? parseInt(row.minPlayers, 10) : null
    const maxPlayers = row.maxPlayers ? parseInt(row.maxPlayers, 10) : null
    await updateGameRecord(row.id, userId, {
      title: row.title.trim(),
      coverUrl: nullIfEmpty(row.coverUrl),
      minPlayers: isNaN(minPlayers!) ? null : minPlayers,
      maxPlayers: isNaN(maxPlayers!) ? null : maxPlayers,
      ageRating: nullIfEmpty(row.ageRating),
      genre: nullIfEmpty(row.genre),
      description: nullIfEmpty(row.description),
    })
    updated++
  }

  revalidatePath("/games")
  return { updated }
}
