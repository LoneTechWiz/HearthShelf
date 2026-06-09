import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/contacts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import {
  findContactMatch,
  createContactRecord,
  updateContactRecord,
} from "@/lib/queries/contacts"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)
const signedIn = () =>
  mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)

function formWith(csv: string): FormData {
  const fd = new FormData()
  fd.set("csv", csv)
  return fd
}

describe("importContacts", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { importContacts } = await import("@/lib/actions/contacts")
    expect(await importContacts(null, formWith("name\nAlice"))).toEqual({
      error: "Unauthorized",
    })
  })

  it("rejects a file missing the name column", async () => {
    signedIn()
    const { importContacts } = await import("@/lib/actions/contacts")
    expect(await importContacts(null, formWith("email\na@b.com"))).toEqual({
      error: 'CSV is missing a required "name" column',
    })
  })

  it("creates a new contact when no match exists", async () => {
    signedIn()
    vi.mocked(findContactMatch).mockResolvedValue(null)
    const { importContacts } = await import("@/lib/actions/contacts")
    const result = await importContacts(
      null,
      formWith("name,email\nAlice,alice@example.com")
    )
    expect(createContactRecord).toHaveBeenCalledWith("u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
    })
    expect(result).toEqual({ created: 1, updated: 0, skipped: [] })
  })

  it("skips a row with no name and reports its line", async () => {
    signedIn()
    vi.mocked(findContactMatch).mockResolvedValue(null)
    const { importContacts } = await import("@/lib/actions/contacts")
    const result = await importContacts(
      null,
      formWith("name,email\n,a@b.com\nBob,bob@b.com")
    )
    expect(result).toMatchObject({
      created: 1,
      skipped: [{ line: 2, reason: "Missing name" }],
    })
  })

  it("updates an existing match, preserving fields the CSV leaves blank", async () => {
    signedIn()
    vi.mocked(findContactMatch).mockResolvedValue({
      id: "c9",
      userId: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "555-1234",
      createdAt: new Date(),
    })
    const { importContacts } = await import("@/lib/actions/contacts")
    const result = await importContacts(
      null,
      formWith("name,email\nAlice,alice@example.com")
    )
    expect(updateContactRecord).toHaveBeenCalledWith("c9", "u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: "555-1234",
    })
    expect(result).toMatchObject({ created: 0, updated: 1 })
  })
})
