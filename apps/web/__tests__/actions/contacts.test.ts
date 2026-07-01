import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/contacts")
vi.mock("@/lib/queries/users")
vi.mock("@/lib/queries/contact-requests")
vi.mock("@/lib/push")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import {
  createContactRecord,
  deleteContactRecord,
  findContactMatch,
  getContactById,
  updateContactRecord,
} from "@/lib/queries/contacts"
import { getUserContactCandidate } from "@/lib/queries/users"
import {
  createContactRequest,
  getPendingIncomingContactRequest,
  getPendingRequestBetweenUsers,
  updateContactRequestStatus,
} from "@/lib/queries/contact-requests"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { sendPushToUser } from "@/lib/push"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("createContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { createContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "Alice")
    const result = await createContact(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error when name is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "")
    const result = await createContact(null, fd)
    expect(result).toEqual({ error: "Name is required" })
  })

  it("creates contact and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1", name: "Grace" }, expires: "" } as Session)
    vi.mocked(createContactRecord).mockResolvedValue()
    const { createContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "Alice")
    fd.set("email", "alice@example.com")
    await createContact(null, fd)
    expect(createContactRecord).toHaveBeenCalledWith("u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/contacts")
    expect(redirect).toHaveBeenCalledWith("/contacts?flash=Contact added")
  })
})

describe("deleteContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    expect(await deleteContact(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("returns error when id is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    expect(await deleteContact(null, fd)).toEqual({ error: "Missing contact id" })
  })

  it("deletes and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getContactById).mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Alice",
      email: null,
      phone: null,
      linkedUserId: null,
      createdAt: new Date(),
    })
    vi.mocked(deleteContactRecord).mockResolvedValue()
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    await deleteContact(null, fd)
    expect(deleteContactRecord).toHaveBeenCalledWith("c1", "u1")
    expect(redirect).toHaveBeenCalledWith("/contacts?flash=Contact deleted")
  })

  it("does not delete linked contacts", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getContactById).mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Alice",
      email: null,
      phone: null,
      linkedUserId: "other-user",
      createdAt: new Date(),
    })
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    expect(await deleteContact(null, fd)).toEqual({
      error: "Contacts added from requests cannot be deleted",
    })
    expect(deleteContactRecord).not.toHaveBeenCalled()
  })
})

describe("updateContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "Bob")
    expect(await updateContact(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("returns error when id is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "Bob")
    expect(await updateContact(null, fd)).toEqual({ error: "Missing contact id" })
  })

  it("returns error when name is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getContactById).mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Alice",
      email: null,
      phone: null,
      linkedUserId: null,
      createdAt: new Date(),
    })
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "")
    expect(await updateContact(null, fd)).toEqual({ error: "Name is required" })
  })

  it("updates and redirects to contact detail", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getContactById).mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Alice",
      email: null,
      phone: null,
      linkedUserId: null,
      createdAt: new Date(),
    })
    vi.mocked(updateContactRecord).mockResolvedValue()
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "Bob")
    await updateContact(null, fd)
    expect(updateContactRecord).toHaveBeenCalledWith("c1", "u1", {
      name: "Bob",
      email: null,
      phone: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/contacts/c1")
    expect(revalidatePath).toHaveBeenCalledWith("/contacts")
    expect(redirect).toHaveBeenCalledWith("/contacts/c1?flash=Contact updated")
  })

  it("does not update linked contacts", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getContactById).mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Alice",
      email: null,
      phone: null,
      linkedUserId: "other-user",
      createdAt: new Date(),
    })
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "Bob")
    expect(await updateContact(null, fd)).toEqual({
      error: "Contacts added from requests cannot be edited",
    })
    expect(updateContactRecord).not.toHaveBeenCalled()
  })
})

describe("requestUserContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("redirects when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { requestUserContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("userId", "target")
    await requestUserContact(fd)
    expect(redirect).toHaveBeenCalledWith("/contacts/new?flash=Unauthorized")
    expect(createContactRecord).not.toHaveBeenCalled()
  })

  it("redirects when selected user is not found", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getUserContactCandidate).mockResolvedValue(null)
    const { requestUserContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("userId", "missing")
    await requestUserContact(fd)
    expect(getUserContactCandidate).toHaveBeenCalledWith("missing", "u1")
    expect(redirect).toHaveBeenCalledWith("/contacts/new?flash=User%20not%20found")
  })

  it("redirects to existing contact when already added", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getUserContactCandidate).mockResolvedValue({
      id: "target",
      name: "Alice",
      email: "alice@example.com",
      image: null,
    })
    vi.mocked(getPendingRequestBetweenUsers).mockResolvedValue(null)
    vi.mocked(findContactMatch).mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: null,
      linkedUserId: null,
      createdAt: new Date(),
    })
    const { requestUserContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("userId", "target")
    await requestUserContact(fd)
    expect(createContactRecord).not.toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith("/contacts/c1?flash=Contact%20already%20exists")
  })

  it("does not create another request when one is pending", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(getUserContactCandidate).mockResolvedValue({
      id: "target",
      name: "Alice",
      email: "alice@example.com",
      image: null,
    })
    vi.mocked(getPendingRequestBetweenUsers).mockResolvedValue({
      id: "r1",
      requesterId: "u1",
      recipientId: "target",
      status: "pending",
      createdAt: new Date(),
      respondedAt: null,
    })
    const { requestUserContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("userId", "target")
    await requestUserContact(fd)
    expect(createContactRequest).not.toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith("/contacts/new?flash=Request%20already%20pending")
  })

  it("creates request for selected user and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1", name: "Grace" }, expires: "" } as Session)
    vi.mocked(getUserContactCandidate).mockResolvedValue({
      id: "target",
      name: "Alice",
      email: "alice@example.com",
      image: null,
    })
    vi.mocked(findContactMatch).mockResolvedValue(null)
    vi.mocked(getPendingRequestBetweenUsers).mockResolvedValue(null)
    vi.mocked(createContactRequest).mockResolvedValue()
    const { requestUserContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("userId", "target")
    await requestUserContact(fd)
    expect(createContactRecord).not.toHaveBeenCalled()
    expect(createContactRequest).toHaveBeenCalledWith("u1", "target")
    expect(sendPushToUser).toHaveBeenCalledWith("target", {
      title: "New contact request",
      body: "Grace wants to connect on HearthShelf.",
      url: "/contacts",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/contacts/new")
    expect(redirect).toHaveBeenCalledWith("/contacts/new?flash=Request%20sent")
  })
})

describe("acceptContactRequest", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates contacts for both users and accepts the request", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "u1", name: "Owner", email: "owner@example.com" },
      expires: "",
    } as Session)
    vi.mocked(getPendingIncomingContactRequest).mockResolvedValue({
      id: "r1",
      createdAt: new Date(),
      requester: {
        id: "requester",
        name: "Alice",
        email: "alice@example.com",
        image: null,
      },
    })
    vi.mocked(findContactMatch).mockResolvedValue(null)
    vi.mocked(createContactRecord).mockResolvedValue()
    vi.mocked(updateContactRequestStatus).mockResolvedValue()
    const { acceptContactRequest } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("requestId", "r1")
    await acceptContactRequest(fd)
    expect(createContactRecord).toHaveBeenCalledWith("u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
      linkedUserId: "requester",
    })
    expect(createContactRecord).toHaveBeenCalledWith("requester", {
      name: "Owner",
      email: "owner@example.com",
      phone: null,
      linkedUserId: "u1",
    })
    expect(updateContactRequestStatus).toHaveBeenCalledWith("r1", "u1", "accepted")
    expect(revalidatePath).toHaveBeenCalledWith("/contacts")
    expect(redirect).toHaveBeenCalledWith("/contacts?flash=Contact%20request%20accepted")
  })
})

describe("declineContactRequest", () => {
  beforeEach(() => vi.clearAllMocks())

  it("declines the request", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(updateContactRequestStatus).mockResolvedValue()
    const { declineContactRequest } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("requestId", "r1")
    await declineContactRequest(fd)
    expect(updateContactRequestStatus).toHaveBeenCalledWith("r1", "u1", "declined")
    expect(revalidatePath).toHaveBeenCalledWith("/contacts")
    expect(redirect).toHaveBeenCalledWith("/contacts?flash=Contact%20request%20declined")
  })
})
