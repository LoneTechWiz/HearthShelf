"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { deleteItemReview, upsertItemReview } from "@/lib/queries/reviews"

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

function parseRating(val: FormDataEntryValue | null): number | null {
  const rating = Number.parseInt(String(val ?? ""), 10)
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null
}

function safeReturnPath(val: FormDataEntryValue | null): string {
  const path = String(val ?? "")
  return path.startsWith("/") && !path.startsWith("//") ? path : "/shelf"
}

function redirectWithFlash(path: string, flash: string): never {
  const separator = path.includes("?") ? "&" : "?"
  redirect(`${path}${separator}flash=${encodeURIComponent(flash)}`)
}

export async function saveReview(formData: FormData): Promise<void> {
  const returnPath = safeReturnPath(formData.get("returnPath"))
  const session = await auth()
  if (!session?.user?.id) return redirectWithFlash(returnPath, "Unauthorized")

  const lendableItemId = nullIfEmpty(formData.get("lendableItemId"))
  if (!lendableItemId) return redirectWithFlash(returnPath, "Missing item")

  const rating = parseRating(formData.get("rating"))
  if (!rating) return redirectWithFlash(returnPath, "Rating must be between 1 and 5")

  const saved = await upsertItemReview(session.user.id, {
    lendableItemId,
    rating,
    body: nullIfEmpty(formData.get("body")),
  })

  if (!saved) return redirectWithFlash(returnPath, "Item not found")

  revalidatePath(returnPath)
  redirectWithFlash(returnPath, "Review saved")
}

export async function removeReview(formData: FormData): Promise<void> {
  const returnPath = safeReturnPath(formData.get("returnPath"))
  const session = await auth()
  if (!session?.user?.id) return redirectWithFlash(returnPath, "Unauthorized")

  const lendableItemId = nullIfEmpty(formData.get("lendableItemId"))
  if (!lendableItemId) return redirectWithFlash(returnPath, "Missing item")

  const deleted = await deleteItemReview(session.user.id, lendableItemId)
  if (!deleted) return redirectWithFlash(returnPath, "Item not found")

  revalidatePath(returnPath)
  redirectWithFlash(returnPath, "Review removed")
}
