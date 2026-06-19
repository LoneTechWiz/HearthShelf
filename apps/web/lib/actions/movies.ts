"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createMovieRecord,
  createMovieRecordReturningId,
  deleteMovieRecord,
  findMovieMatch,
  updateMovieRecord,
} from "@/lib/queries/movies"
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

export async function createMovie(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await createMovieRecord(session.user.id, {
    title,
    director: nullIfEmpty(formData.get("director")),
    year: nullableInt(formData.get("year")),
    posterUrl: nullIfEmpty(formData.get("posterUrl")),
    format: nullIfEmpty(formData.get("format")),
    genre: nullIfEmpty(formData.get("genre")),
    runtime: nullableInt(formData.get("runtime")),
    description: nullIfEmpty(formData.get("description")),
  })

  revalidatePath("/movies")
  redirect("/movies?flash=Movie added")
  return null
}

export async function deleteMovie(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing movie id" }
  await deleteMovieRecord(id, session.user.id)

  revalidatePath("/movies")
  redirect("/movies?flash=Movie deleted")
  return null
}

export async function updateMovie(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing movie id" }
  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await updateMovieRecord(id, session.user.id, {
    title,
    director: nullIfEmpty(formData.get("director")),
    year: nullableInt(formData.get("year")),
    posterUrl: nullIfEmpty(formData.get("posterUrl")),
    format: nullIfEmpty(formData.get("format")),
    genre: nullIfEmpty(formData.get("genre")),
    runtime: nullableInt(formData.get("runtime")),
    description: nullIfEmpty(formData.get("description")),
  })

  revalidatePath(`/movies/${id}`)
  revalidatePath("/movies")
  redirect(`/movies/${id}?flash=Movie updated`)
  return null
}

const MOVIE_COLUMNS = ["title", "director", "year", "posterUrl", "format", "genre", "runtime", "description"] as const

export async function importMovies(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  const text = String(formData.get("csv") ?? "")
  if (text.trim() === "") return { error: "The file is empty" }

  const { records, missingColumns } = toRecords(parseCsv(text), MOVIE_COLUMNS)
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
    const year = values.year ? parseInt(values.year, 10) : null
    const runtime = values.runtime ? parseInt(values.runtime, 10) : null
    const data = {
      title,
      director: values.director ?? null,
      year: isNaN(year!) ? null : year,
      posterUrl: values.posterUrl ?? null,
      format: values.format ?? null,
      genre: values.genre ?? null,
      runtime: isNaN(runtime!) ? null : runtime,
      description: values.description ?? null,
    }

    const existing = await findMovieMatch(userId, { title })
    if (existing) {
      await updateMovieRecord(existing.id, userId, {
        title,
        director: data.director ?? existing.director,
        year: data.year ?? existing.year,
        posterUrl: data.posterUrl ?? existing.posterUrl,
        format: data.format ?? existing.format,
        genre: data.genre ?? existing.genre,
        runtime: data.runtime ?? existing.runtime,
        description: data.description ?? existing.description,
      })
      updated++
      importedIds.push(existing.id)
    } else {
      const id = await createMovieRecordReturningId(userId, data)
      created++
      importedIds.push(id)
    }
  }

  revalidatePath("/movies")
  return { created, updated, skipped, importedIds }
}

type BulkEditRow = {
  id: string
  title: string
  director: string
  year: string
  posterUrl: string
  format: string
  genre: string
  runtime: string
  description: string
}

export async function bulkUpdateMovies(
  _prevState: { updated: number } | { error: string } | null,
  formData: FormData
): Promise<{ updated: number } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  let rows: BulkEditRow[]
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"))
  } catch {
    return { error: "Invalid data" }
  }

  let updated = 0
  for (const row of rows) {
    if (!row.id || !row.title?.trim()) continue
    const year = row.year ? parseInt(row.year, 10) : null
    const runtime = row.runtime ? parseInt(row.runtime, 10) : null
    await updateMovieRecord(row.id, userId, {
      title: row.title.trim(),
      director: nullIfEmpty(row.director),
      year: isNaN(year!) ? null : year,
      posterUrl: nullIfEmpty(row.posterUrl),
      format: nullIfEmpty(row.format),
      genre: nullIfEmpty(row.genre),
      runtime: isNaN(runtime!) ? null : runtime,
      description: nullIfEmpty(row.description),
    })
    updated++
  }

  revalidatePath("/movies")
  return { updated }
}
