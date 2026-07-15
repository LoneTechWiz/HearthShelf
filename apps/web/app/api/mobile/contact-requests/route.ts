import {
  createContactRecord,
  findContactMatch,
} from "@/lib/queries/contacts"
import {
  createContactRequest,
  getIncomingContactRequests,
  getPendingIncomingContactRequest,
  getPendingRequestBetweenUsers,
  updateContactRequestStatus,
} from "@/lib/queries/contact-requests"
import { getUserContactCandidate, searchUsersByName } from "@/lib/queries/users"
import { sendPushToUser } from "@/lib/push"
import { jsonError, nullIfEmpty, requireMobileUser } from "@/app/api/mobile/_utils"

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  const [requests, users] = await Promise.all([
    getIncomingContactRequests(user.id),
    query.length >= 2 ? searchUsersByName(user.id, query) : Promise.resolve([]),
  ])

  return Response.json({
    requests: requests.map((request) => ({
      id: request.id,
      createdAt: request.createdAt.toISOString(),
      requester: {
        id: request.requester.id,
        name: request.requester.name,
        image: request.requester.image,
      },
    })),
    users,
  })
}

export async function POST(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const body = await request.json()
  const action = nullIfEmpty(body.action)

  if (action === "request") {
    const targetUserId = nullIfEmpty(body.userId)
    if (!targetUserId) return jsonError("User is required")
    const target = await getUserContactCandidate(targetUserId, user.id)
    if (!target?.name || !target.email) return jsonError("User not found", 404)
    if (await getPendingRequestBetweenUsers(user.id, target.id)) {
      return jsonError("Request already pending", 409)
    }
    if (await findContactMatch(user.id, { name: target.name, email: target.email })) {
      return jsonError("Contact already exists", 409)
    }
    await createContactRequest(user.id, target.id)
    await sendPushToUser(target.id, {
      title: "New contact request",
      body: `${user.name ?? "Someone"} wants to connect on HearthShelf.`,
      url: "/contacts",
    })
    return Response.json({ ok: true }, { status: 201 })
  }

  const requestId = nullIfEmpty(body.requestId)
  if (!requestId) return jsonError("Request is required")
  if (action === "decline") {
    await updateContactRequestStatus(requestId, user.id, "declined")
    return Response.json({ ok: true })
  }
  if (action !== "accept") return jsonError("Unknown action")

  const incoming = await getPendingIncomingContactRequest(requestId, user.id)
  if (!incoming) return jsonError("Request not found", 404)
  const currentUserName = user.name?.trim() || user.email
  if (!currentUserName || !user.email) return jsonError("Your profile is missing contact details", 409)

  if (!await findContactMatch(user.id, {
    name: incoming.requester.name,
    email: incoming.requester.email,
  })) {
    await createContactRecord(user.id, {
      name: incoming.requester.name,
      email: incoming.requester.email,
      phone: null,
      linkedUserId: incoming.requester.id,
    })
  }

  if (!await findContactMatch(incoming.requester.id, {
    name: currentUserName,
    email: user.email,
  })) {
    await createContactRecord(incoming.requester.id, {
      name: currentUserName,
      email: user.email,
      phone: null,
      linkedUserId: user.id,
    })
  }

  await updateContactRequestStatus(requestId, user.id, "accepted")
  return Response.json({ ok: true })
}
