import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/checkouts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createCheckoutRecord, returnBookRecord } from "@/lib/queries/checkouts"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("createCheckout", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("bookId", "b1")
    expect(await createCheckout(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("returns error when bookId is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    expect(await createCheckout(null, fd)).toEqual({ error: "Book is required" })
  })

  it("creates checkout with contactId null when borrower is self", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createCheckoutRecord).mockResolvedValue()
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("bookId", "b1")
    fd.set("borrower", "self")
    await createCheckout(null, fd)
    expect(createCheckoutRecord).toHaveBeenCalledWith("u1", {
      bookId: "b1",
      contactId: null,
      dueDate: null,
      notes: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/checkouts")
    expect(redirect).toHaveBeenCalledWith("/checkouts")
  })

  it("creates checkout with contactId when borrower is a contact", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createCheckoutRecord).mockResolvedValue()
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("bookId", "b1")
    fd.set("borrower", "contact:c1")
    fd.set("dueDate", "2026-07-01")
    fd.set("notes", "Handle with care")
    await createCheckout(null, fd)
    expect(createCheckoutRecord).toHaveBeenCalledWith("u1", {
      bookId: "b1",
      contactId: "c1",
      dueDate: new Date("2026-07-01"),
      notes: "Handle with care",
    })
  })
})

describe("returnBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { returnBook } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("checkoutId", "co1")
    expect(await returnBook(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("calls returnBookRecord and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(returnBookRecord).mockResolvedValue()
    const { returnBook } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("checkoutId", "co1")
    await returnBook(null, fd)
    expect(returnBookRecord).toHaveBeenCalledWith("co1", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/checkouts")
    expect(redirect).toHaveBeenCalledWith("/checkouts")
  })
})
