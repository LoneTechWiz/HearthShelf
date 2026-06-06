"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createBookRecord, deleteBookRecord, updateBookRecord } from "@/lib/queries/books"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
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
    description: nullIfEmpty(formData.get("description")),
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
  })

  revalidatePath("/books")
  redirect("/books")
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

  revalidatePath("/books")
  redirect("/books")
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
    description: nullIfEmpty(formData.get("description")),
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
  })

  revalidatePath(`/books/${id}`)
  revalidatePath("/books")
  redirect(`/books/${id}`)
  return null
}
