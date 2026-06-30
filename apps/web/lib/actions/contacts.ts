"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createContactRecord,
  deleteContactRecord,
  findContactMatch,
  getContactById,
  updateContactRecord,
} from "@/lib/queries/contacts"
import {
  createContactRequest,
  getPendingIncomingContactRequest,
  getPendingRequestBetweenUsers,
  updateContactRequestStatus,
} from "@/lib/queries/contact-requests"
import { getUserContactCandidate } from "@/lib/queries/users"
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
  redirect("/contacts?flash=Contact added")
  return null
}

export async function requestUserContact(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/contacts/new?flash=Unauthorized")
    return
  }

  const targetUserId = String(formData.get("userId") ?? "")
  if (!targetUserId) {
    redirect("/contacts/new?flash=Missing%20user")
    return
  }

  const user = await getUserContactCandidate(targetUserId, session.user.id)
  if (!user?.name || !user.email) {
    redirect("/contacts/new?flash=User%20not%20found")
    return
  }

  const pendingRequest = await getPendingRequestBetweenUsers(session.user.id, user.id)
  if (pendingRequest) {
    redirect("/contacts/new?flash=Request%20already%20pending")
    return
  }

  const existing = await findContactMatch(session.user.id, {
    name: user.name,
    email: user.email,
  })
  if (existing) {
    redirect(`/contacts/${existing.id}?flash=Contact%20already%20exists`)
    return
  }

  await createContactRequest(session.user.id, user.id)

  revalidatePath("/contacts/new")
  redirect("/contacts/new?flash=Request%20sent")
}

export async function acceptContactRequest(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/contacts?flash=Unauthorized")
    return
  }

  const requestId = String(formData.get("requestId") ?? "")
  if (!requestId) {
    redirect("/contacts?flash=Missing%20request")
    return
  }

  const request = await getPendingIncomingContactRequest(requestId, session.user.id)
  if (!request) {
    redirect("/contacts?flash=Request%20not%20found")
    return
  }

  const currentUserName = session.user.name?.trim() || session.user.email
  const currentUserEmail = session.user.email
  if (!currentUserName || !currentUserEmail) {
    redirect("/contacts?flash=Your%20profile%20is%20missing%20contact%20details")
    return
  }

  const existingRecipientContact = await findContactMatch(session.user.id, {
    name: request.requester.name,
    email: request.requester.email,
  })
  if (!existingRecipientContact) {
    await createContactRecord(session.user.id, {
      name: request.requester.name,
      email: request.requester.email,
      phone: null,
      linkedUserId: request.requester.id,
    })
  }

  const existingRequesterContact = await findContactMatch(request.requester.id, {
    name: currentUserName,
    email: currentUserEmail,
  })
  if (!existingRequesterContact) {
    await createContactRecord(request.requester.id, {
      name: currentUserName,
      email: currentUserEmail,
      phone: null,
      linkedUserId: session.user.id,
    })
  }

  await updateContactRequestStatus(request.id, session.user.id, "accepted")

  revalidatePath("/contacts")
  redirect("/contacts?flash=Contact%20request%20accepted")
}

export async function declineContactRequest(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/contacts?flash=Unauthorized")
    return
  }

  const requestId = String(formData.get("requestId") ?? "")
  if (!requestId) {
    redirect("/contacts?flash=Missing%20request")
    return
  }

  await updateContactRequestStatus(requestId, session.user.id, "declined")

  revalidatePath("/contacts")
  redirect("/contacts?flash=Contact%20request%20declined")
}

export async function deleteContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing contact id" }
  const contact = await getContactById(id, session.user.id)
  if (!contact) return { error: "Contact not found" }
  if (contact.linkedUserId) return { error: "Contacts added from requests cannot be deleted" }

  await deleteContactRecord(id, session.user.id)

  revalidatePath("/contacts")
  redirect("/contacts?flash=Contact deleted")
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
  const contact = await getContactById(id, session.user.id)
  if (!contact) return { error: "Contact not found" }
  if (contact.linkedUserId) return { error: "Contacts added from requests cannot be edited" }

  const name = nullIfEmpty(formData.get("name"))
  if (!name) return { error: "Name is required" }

  await updateContactRecord(id, session.user.id, {
    name,
    email: nullIfEmpty(formData.get("email")),
    phone: nullIfEmpty(formData.get("phone")),
  })

  revalidatePath(`/contacts/${id}`)
  revalidatePath("/contacts")
  redirect(`/contacts/${id}?flash=Contact updated`)
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
