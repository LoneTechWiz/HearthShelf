import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/checkouts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createCheckoutRecord, returnItemRecord } from "@/lib/queries/checkouts"
import { redirect } from "next/navigation"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("createCheckout", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("lendableItemId", "li1")
    expect(await createCheckout(null, fd)).toEqual({ error: "Unauthorized" })
    expect(createCheckoutRecord).not.toHaveBeenCalled()
  })

  it("returns error when lendableItemId is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createCheckout } = await import("@/lib/actions/checkouts")
    expect(await createCheckout(null, new FormData())).toEqual({ error: "Item is required" })
  })

  it("calls createCheckoutRecord with correct args and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createCheckoutRecord).mockResolvedValue()
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("lendableItemId", "li1")
    fd.set("borrower", "contact:c1")
    fd.set("dueDate", "2026-07-01")
    await createCheckout(null, fd)
    expect(createCheckoutRecord).toHaveBeenCalledWith("u1", {
      lendableItemId: "li1",
      contactId: "c1",
      dueDate: new Date("2026-07-01"),
      notes: null,
    })
    expect(redirect).toHaveBeenCalledWith("/checkouts?flash=Item checked out")
  })
})

describe("returnItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { returnItem } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("checkoutId", "co1")
    expect(await returnItem(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("calls returnItemRecord and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(returnItemRecord).mockResolvedValue()
    const { returnItem } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("checkoutId", "co1")
    await returnItem(null, fd)
    expect(returnItemRecord).toHaveBeenCalledWith("co1", "u1")
    expect(redirect).toHaveBeenCalledWith("/checkouts?flash=Item returned")
  })
})
