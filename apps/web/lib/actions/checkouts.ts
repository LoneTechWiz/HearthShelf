"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createCheckoutRecord, returnItemRecord } from "@/lib/queries/checkouts"

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

  const lendableItemId = nullIfEmpty(formData.get("lendableItemId"))
  if (!lendableItemId) return { error: "Item is required" }

  const borrower = String(formData.get("borrower") ?? "self")
  const contactId = borrower.startsWith("contact:") ? borrower.slice(8) : null

  const dueDateStr = nullIfEmpty(formData.get("dueDate"))
  const dueDate = dueDateStr ? new Date(dueDateStr) : null

  await createCheckoutRecord(session.user.id, {
    lendableItemId,
    contactId,
    dueDate,
    notes: nullIfEmpty(formData.get("notes")),
  })

  revalidatePath("/checkouts")
  redirect("/checkouts?flash=Item checked out")
  return null
}

export async function returnItem(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const checkoutId = String(formData.get("checkoutId") ?? "")
  await returnItemRecord(checkoutId, session.user.id)

  revalidatePath("/checkouts")
  redirect("/checkouts?flash=Item returned")
  return null
}
