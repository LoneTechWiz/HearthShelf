"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createContactRecord,
  deleteContactRecord,
  findContactMatch,
  updateContactRecord,
} from "@/lib/queries/contacts"
import { parseCsv, toRecords } from "@/lib/csv/parse"
import type { ImportResult, ImportSkip } from "@/lib/csv/types"

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

const CONTACT_COLUMNS = ["name", "email", "phone"] as const

export async function importContacts(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  const text = String(formData.get("csv") ?? "")
  if (text.trim() === "") return { error: "The file is empty" }

  const { records, missingColumns } = toRecords(parseCsv(text), CONTACT_COLUMNS)
  if (missingColumns.includes("name")) {
    return { error: 'CSV is missing a required "name" column' }
  }

  let created = 0
  let updated = 0
  const skipped: ImportSkip[] = []

  for (const { line, values } of records) {
    const name = values.name
    if (!name) {
      skipped.push({ line, reason: "Missing name" })
      continue
    }
    const data = { name, email: values.email, phone: values.phone }

    const existing = await findContactMatch(userId, data)
    if (existing) {
      await updateContactRecord(existing.id, userId, {
        name,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
      })
      updated++
    } else {
      await createContactRecord(userId, data)
      created++
    }
  }

  revalidatePath("/contacts")
  return { created, updated, skipped }
}
