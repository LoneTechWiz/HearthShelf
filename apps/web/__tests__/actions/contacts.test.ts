import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/contacts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createContactRecord, deleteContactRecord, updateContactRecord } from "@/lib/queries/contacts"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
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
    vi.mocked(deleteContactRecord).mockResolvedValue()
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    await deleteContact(null, fd)
    expect(deleteContactRecord).toHaveBeenCalledWith("c1", "u1")
    expect(redirect).toHaveBeenCalledWith("/contacts?flash=Contact deleted")
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
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "")
    expect(await updateContact(null, fd)).toEqual({ error: "Name is required" })
  })

  it("updates and redirects to contact detail", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
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
})
