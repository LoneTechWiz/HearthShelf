import {
  createContactRecord,
  getContactsForUser,
} from "@/lib/queries/contacts"
import {
  jsonError,
  nullIfEmpty,
  requireMobileUser,
  toMobileContact,
} from "@/app/api/mobile/_utils"

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const contacts = await getContactsForUser(user.id)
  return Response.json({ contacts: contacts.map(toMobileContact) })
}

export async function POST(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const name = nullIfEmpty(body.name)
  if (!name) return jsonError("Name is required")

  await createContactRecord(user.id, {
    name,
    email: nullIfEmpty(body.email),
    phone: nullIfEmpty(body.phone),
  })

  return Response.json({ ok: true }, { status: 201 })
}
