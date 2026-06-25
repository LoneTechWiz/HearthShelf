import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/movies")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createMovieRecord } from "@/lib/queries/movies"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)

describe("createMovie", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { createMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("title", "Inception")
    expect(await createMovie(null, fd)).toEqual({ error: "Unauthorized" })
    expect(createMovieRecord).not.toHaveBeenCalled()
  })

  it("returns error when title is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("title", "   ")
    expect(await createMovie(null, fd)).toEqual({ error: "Title is required" })
  })

  it("calls createMovieRecord with userId and all fields", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createMovieRecord).mockResolvedValue()
    const { createMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("title", "Inception")
    fd.set("director", "Christopher Nolan")
    fd.set("year", "2010")
    fd.set("format", "Blu-ray")
    await createMovie(null, fd)
    expect(createMovieRecord).toHaveBeenCalledWith("u1", {
      title: "Inception",
      director: "Christopher Nolan",
      year: 2010,
      posterUrl: null,
      format: "Blu-ray",
      genre: null,
      runtime: null,
      description: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/movies")
    expect(redirect).toHaveBeenCalledWith("/movies?flash=Movie added")
  })
})

describe("deleteMovie", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { deleteMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("id", "m1")
    expect(await deleteMovie(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("returns error when id is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteMovie } = await import("@/lib/actions/movies")
    expect(await deleteMovie(null, new FormData())).toEqual({ error: "Missing movie id" })
  })

  it("calls deleteMovieRecord and redirects", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteMovieRecord } = await import("@/lib/queries/movies")
    vi.mocked(deleteMovieRecord).mockResolvedValue()
    const { deleteMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("id", "m1")
    await deleteMovie(null, fd)
    expect(deleteMovieRecord).toHaveBeenCalledWith("m1", "u1")
    expect(redirect).toHaveBeenCalledWith("/movies?flash=Movie deleted")
  })
})

describe("updateMovie", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when title is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { updateMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("id", "m1")
    fd.set("title", "")
    expect(await updateMovie(null, fd)).toEqual({ error: "Title is required" })
  })

  it("calls updateMovieRecord and redirects to detail", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { updateMovieRecord } = await import("@/lib/queries/movies")
    vi.mocked(updateMovieRecord).mockResolvedValue()
    const { updateMovie } = await import("@/lib/actions/movies")
    const fd = new FormData()
    fd.set("id", "m1")
    fd.set("title", "Inception")
    fd.set("format", "DVD")
    await updateMovie(null, fd)
    expect(updateMovieRecord).toHaveBeenCalledWith("m1", "u1", expect.objectContaining({
      title: "Inception",
      format: "DVD",
    }))
    expect(redirect).toHaveBeenCalledWith("/movies/m1?flash=Movie updated")
  })
})
