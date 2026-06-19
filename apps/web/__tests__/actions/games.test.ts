import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/games")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createGameRecord } from "@/lib/queries/games"
import { redirect } from "next/navigation"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("createGame", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { createGame } = await import("@/lib/actions/games")
    const fd = new FormData()
    fd.set("title", "Catan")
    expect(await createGame(null, fd)).toEqual({ error: "Unauthorized" })
    expect(createGameRecord).not.toHaveBeenCalled()
  })

  it("returns error when title is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createGame } = await import("@/lib/actions/games")
    const fd = new FormData()
    fd.set("title", "")
    expect(await createGame(null, fd)).toEqual({ error: "Title is required" })
  })

  it("calls createGameRecord with userId and fields", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createGameRecord).mockResolvedValue()
    const { createGame } = await import("@/lib/actions/games")
    const fd = new FormData()
    fd.set("title", "Catan")
    fd.set("minPlayers", "3")
    fd.set("maxPlayers", "4")
    await createGame(null, fd)
    expect(createGameRecord).toHaveBeenCalledWith("u1", {
      title: "Catan",
      coverUrl: null,
      minPlayers: 3,
      maxPlayers: 4,
      ageRating: null,
      genre: null,
      description: null,
    })
    expect(redirect).toHaveBeenCalledWith("/games?flash=Game added")
  })
})

describe("deleteGame", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when id is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteGame } = await import("@/lib/actions/games")
    expect(await deleteGame(null, new FormData())).toEqual({ error: "Missing game id" })
  })

  it("calls deleteGameRecord and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteGameRecord } = await import("@/lib/queries/games")
    vi.mocked(deleteGameRecord).mockResolvedValue()
    const { deleteGame } = await import("@/lib/actions/games")
    const fd = new FormData()
    fd.set("id", "g1")
    await deleteGame(null, fd)
    expect(deleteGameRecord).toHaveBeenCalledWith("g1", "u1")
    expect(redirect).toHaveBeenCalledWith("/games?flash=Game deleted")
  })
})
