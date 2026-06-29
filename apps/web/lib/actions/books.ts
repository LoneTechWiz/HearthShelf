"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createBookRecord,
  createBookRecordReturningId,
  deleteBookRecord,
  findBookMatch,
  updateBookRecord,
} from "@/lib/queries/books"
import { parseCsv, toRecords } from "@/lib/csv/parse"
import type { ImportResult, ImportSkip } from "@/lib/csv/types"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

function optionalPositiveInt(val: FormDataEntryValue | null): number | null {
  const text = nullIfEmpty(val)
  if (!text) return null
  const parsed = Number.parseInt(text, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function createBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await createBookRecord(session.user.id, {
    title,
    authors: nullIfEmpty(formData.get("authors")),
    isbn: nullIfEmpty(formData.get("isbn")),
    seriesName: nullIfEmpty(formData.get("seriesName")),
    seriesPosition: optionalPositiveInt(formData.get("seriesPosition")),
    seriesTotal: optionalPositiveInt(formData.get("seriesTotal")),
    description: nullIfEmpty(formData.get("description")),
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
  })

  revalidatePath("/shelf")
  redirect("/shelf?type=books&flash=Book%20added")
  return null
}

export async function deleteBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing book id" }
  await deleteBookRecord(id, session.user.id)

  revalidatePath("/shelf")
  redirect("/shelf?type=books&flash=Book%20deleted")
  return null
}

export async function updateBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing book id" }
  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await updateBookRecord(id, session.user.id, {
    title,
    authors: nullIfEmpty(formData.get("authors")),
    isbn: nullIfEmpty(formData.get("isbn")),
    seriesName: nullIfEmpty(formData.get("seriesName")),
    seriesPosition: optionalPositiveInt(formData.get("seriesPosition")),
    seriesTotal: optionalPositiveInt(formData.get("seriesTotal")),
    description: nullIfEmpty(formData.get("description")),
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
  })

  revalidatePath(`/books/${id}`)
  revalidatePath("/shelf")
  redirect(`/books/${id}?flash=Book updated`)
  return null
}

const BOOK_COLUMNS = [
  "title",
  "authors",
  "isbn",
  "seriesName",
  "seriesPosition",
  "seriesTotal",
  "description",
  "coverUrl",
] as const

export async function importBooks(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  const text = String(formData.get("csv") ?? "")
  if (text.trim() === "") return { error: "The file is empty" }

  const { records, missingColumns } = toRecords(parseCsv(text), BOOK_COLUMNS)
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
    const data = {
      title,
      authors: values.authors,
      isbn: values.isbn,
      seriesName: values.seriesName,
      seriesPosition: optionalPositiveInt(values.seriesPosition),
      seriesTotal: optionalPositiveInt(values.seriesTotal),
      description: values.description,
      coverUrl: values.coverUrl,
    }

    const existing = await findBookMatch(userId, data)
    if (existing) {
      await updateBookRecord(existing.id, userId, {
        title,
        authors: data.authors ?? existing.authors,
        isbn: data.isbn ?? existing.isbn,
        seriesName: data.seriesName ?? existing.seriesName,
        seriesPosition: data.seriesPosition ?? existing.seriesPosition,
        seriesTotal: data.seriesTotal ?? existing.seriesTotal,
        description: data.description ?? existing.description,
        coverUrl: data.coverUrl ?? existing.coverUrl,
      })
      updated++
      importedIds.push(existing.id)
    } else {
      const id = await createBookRecordReturningId(userId, data)
      created++
      importedIds.push(id)
    }
  }

  revalidatePath("/shelf")
  return { created, updated, skipped, importedIds }
}

type BulkEditRow = {
  id: string
  title: string
  authors: string
  isbn: string
  seriesName: string
  seriesPosition: string
  seriesTotal: string
  description: string
  coverUrl: string
}

export async function bulkUpdateBooks(
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
    await updateBookRecord(row.id, userId, {
      title: row.title.trim(),
      authors: nullIfEmpty(row.authors),
      isbn: nullIfEmpty(row.isbn),
      seriesName: nullIfEmpty(row.seriesName),
      seriesPosition: optionalPositiveInt(row.seriesPosition),
      seriesTotal: optionalPositiveInt(row.seriesTotal),
      description: nullIfEmpty(row.description),
      coverUrl: nullIfEmpty(row.coverUrl),
    })
    updated++
  }

  revalidatePath("/shelf")
  return { updated }
}
