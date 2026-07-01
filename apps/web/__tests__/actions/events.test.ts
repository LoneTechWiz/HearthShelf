import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/events")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createEventRecord, deleteEventRecord } from "@/lib/queries/events"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { createEvent } = await import("@/lib/actions/events")
    const fd = new FormData()
    fd.set("title", "Book Club")
    expect(await createEvent(null, fd)).toEqual({ error: "Unauthorized" })
    expect(createEventRecord).not.toHaveBeenCalled()
  })

  it("returns error when required fields are missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createEvent } = await import("@/lib/actions/events")
    expect(await createEvent(null, new FormData())).toEqual({ error: "Title is required" })
  })

  it("creates an event and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createEventRecord).mockResolvedValue(true)
    const { createEvent } = await import("@/lib/actions/events")
    const fd = new FormData()
    fd.set("title", "Dune Book Club")
    fd.set("type", "book_club")
    fd.set("startsAt", "2026-07-10T19:00")
    fd.set("recurrence", "monthly")
    fd.append("lendableItemIds", "li1")
    fd.append("lendableItemIds", "li2")
    fd.set("notes", "Read chapters 1-4")
    await createEvent(null, fd)
    expect(createEventRecord).toHaveBeenCalledWith("u1", {
      title: "Dune Book Club",
      type: "book_club",
      startsAt: new Date("2026-07-10T19:00"),
      recurrence: "monthly",
      lendableItemIds: ["li1", "li2"],
      notes: "Read chapters 1-4",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/events")
    expect(redirect).toHaveBeenCalledWith("/events?flash=Event%20created")
  })

  it("returns error when the selected item is not owned by the user", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createEventRecord).mockResolvedValue(false)
    const { createEvent } = await import("@/lib/actions/events")
    const fd = new FormData()
    fd.set("title", "Movie Night")
    fd.set("type", "movie_night")
    fd.set("startsAt", "2026-07-10T19:00")
    fd.append("lendableItemIds", "li2")
    expect(await createEvent(null, fd)).toEqual({ error: "Selected item was not found" })
  })
})

describe("deleteEvent", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes an event and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(deleteEventRecord).mockResolvedValue()
    const { deleteEvent } = await import("@/lib/actions/events")
    const fd = new FormData()
    fd.set("id", "event1")
    await deleteEvent(null, fd)
    expect(deleteEventRecord).toHaveBeenCalledWith("event1", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/events")
    expect(redirect).toHaveBeenCalledWith("/events?flash=Event%20deleted")
  })
})
