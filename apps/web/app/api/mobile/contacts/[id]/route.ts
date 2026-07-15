import {
  deleteContactRecord,
  getContactById,
  updateContactRecord,
} from "@/lib/queries/contacts"
import {
  jsonError,
  nullIfEmpty,
  requireMobileUser,
  toMobileContact,
} from "@/app/api/mobile/_utils"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const contact = await getContactById((await params).id, user.id)
  return contact ? Response.json({ contact: toMobileContact(contact) }) : jsonError("Not found", 404)
}

export async function PUT(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const contact = await getContactById((await params).id, user.id)
  if (!contact) return jsonError("Not found", 404)
  if (contact.linkedUserId) return jsonError("Connected contacts cannot be edited", 409)
  const name = nullIfEmpty(body.name)
  if (!name) return jsonError("Name is required")

  await updateContactRecord((await params).id, user.id, {
    name,
    email: nullIfEmpty(body.email),
    phone: nullIfEmpty(body.phone),
  })

  return Response.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const contact = await getContactById((await params).id, user.id)
  if (!contact) return jsonError("Not found", 404)
  if (contact.linkedUserId) return jsonError("Connected contacts cannot be deleted", 409)
  await deleteContactRecord(contact.id, user.id)
  return Response.json({ ok: true })
}
