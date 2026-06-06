"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createContactRecord,
  deleteContactRecord,
  updateContactRecord,
} from "@/lib/queries/contacts"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

export async function createContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const name = nullIfEmpty(formData.get("name"))
  if (!name) return { error: "Name is required" }

  await createContactRecord(session.user.id, {
    name,
    email: nullIfEmpty(formData.get("email")),
    phone: nullIfEmpty(formData.get("phone")),
  })

  revalidatePath("/contacts")
  redirect("/contacts")
  return null
}

export async function deleteContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing contact id" }
  await deleteContactRecord(id, session.user.id)

  revalidatePath("/contacts")
  redirect("/contacts")
  return null
}

export async function updateContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing contact id" }
  const name = nullIfEmpty(formData.get("name"))
  if (!name) return { error: "Name is required" }

  await updateContactRecord(id, session.user.id, {
    name,
    email: nullIfEmpty(formData.get("email")),
    phone: nullIfEmpty(formData.get("phone")),
  })

  revalidatePath(`/contacts/${id}`)
  revalidatePath("/contacts")
  redirect(`/contacts/${id}`)
  return null
}
