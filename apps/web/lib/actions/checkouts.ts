"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createCheckoutRecord, returnBookRecord } from "@/lib/queries/checkouts"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

export async function createCheckout(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const bookId = nullIfEmpty(formData.get("bookId"))
  if (!bookId) return { error: "Book is required" }

  // borrower is either "self" or "contact:<contactId>"
  const borrower = String(formData.get("borrower") ?? "self")
  const contactId = borrower.startsWith("contact:") ? borrower.slice(8) : null

  const dueDateStr = nullIfEmpty(formData.get("dueDate"))
  const dueDate = dueDateStr ? new Date(dueDateStr) : null

  await createCheckoutRecord(session.user.id, {
    bookId,
    contactId,
    dueDate,
    notes: nullIfEmpty(formData.get("notes")),
  })

  revalidatePath("/checkouts")
  redirect("/checkouts?flash=Book checked out")
  return null
}

export async function returnBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const checkoutId = String(formData.get("checkoutId") ?? "")
  await returnBookRecord(checkoutId, session.user.id)

  revalidatePath("/checkouts")
  redirect("/checkouts?flash=Book returned")
  return null
}
