import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/reviews")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { deleteItemReview, upsertItemReview } from "@/lib/queries/reviews"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("saveReview", () => {
  beforeEach(() => vi.clearAllMocks())

  it("redirects with unauthorized flash when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { saveReview } = await import("@/lib/actions/reviews")
    const fd = new FormData()
    fd.set("returnPath", "/books/b1")
    await saveReview(fd)
    expect(redirect).toHaveBeenCalledWith("/books/b1?flash=Unauthorized")
    expect(upsertItemReview).not.toHaveBeenCalled()
  })

  it("redirects when rating is invalid", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { saveReview } = await import("@/lib/actions/reviews")
    const fd = new FormData()
    fd.set("returnPath", "/books/b1")
    fd.set("lendableItemId", "li1")
    fd.set("rating", "6")
    await saveReview(fd)
    expect(redirect).toHaveBeenCalledWith("/books/b1?flash=Rating%20must%20be%20between%201%20and%205")
    expect(upsertItemReview).not.toHaveBeenCalled()
  })

  it("upserts a review and redirects back to the item", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(upsertItemReview).mockResolvedValue(true)
    const { saveReview } = await import("@/lib/actions/reviews")
    const fd = new FormData()
    fd.set("returnPath", "/movies/m1")
    fd.set("lendableItemId", "li1")
    fd.set("rating", "4")
    fd.set("body", "Worth rewatching.")
    await saveReview(fd)
    expect(upsertItemReview).toHaveBeenCalledWith("u1", {
      lendableItemId: "li1",
      rating: 4,
      body: "Worth rewatching.",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/movies/m1")
    expect(redirect).toHaveBeenCalledWith("/movies/m1?flash=Review%20saved")
  })

  it("does not redirect to an external return path", async () => {
    mockedAuth.mockResolvedValue(null)
    const { saveReview } = await import("@/lib/actions/reviews")
    const fd = new FormData()
    fd.set("returnPath", "https://example.com")
    await saveReview(fd)
    expect(redirect).toHaveBeenCalledWith("/shelf?flash=Unauthorized")
  })
})

describe("removeReview", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes a review and redirects back to the item", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(deleteItemReview).mockResolvedValue(true)
    const { removeReview } = await import("@/lib/actions/reviews")
    const fd = new FormData()
    fd.set("returnPath", "/games/g1")
    fd.set("lendableItemId", "li1")
    await removeReview(fd)
    expect(deleteItemReview).toHaveBeenCalledWith("u1", "li1")
    expect(revalidatePath).toHaveBeenCalledWith("/games/g1")
    expect(redirect).toHaveBeenCalledWith("/games/g1?flash=Review%20removed")
  })
})
