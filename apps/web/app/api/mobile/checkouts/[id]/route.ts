import {
  deleteCheckoutRecord,
  updateCheckoutRecord,
} from "@/lib/queries/checkouts"
import {
  nullableDate,
  nullIfEmpty,
  requireMobileUser,
} from "@/app/api/mobile/_utils"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  await updateCheckoutRecord((await params).id, user.id, {
    contactId: nullIfEmpty(body.contactId),
    dueDate: nullableDate(body.dueDate),
    notes: nullIfEmpty(body.notes),
  })

  return Response.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  await deleteCheckoutRecord((await params).id, user.id)
  return Response.json({ ok: true })
}
