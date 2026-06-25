import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"
import { updateBookRecord as updateBookRecordMock } from "@/lib/queries/books"

vi.mock("@/auth")
vi.mock("@/lib/queries/books")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import {
  findBookMatch,
  createBookRecordReturningId,
  updateBookRecord,
} from "@/lib/queries/books"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)
const signedIn = () =>
  mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)

function formWith(csv: string): FormData {
  const fd = new FormData()
  fd.set("csv", csv)
  return fd
}

describe("importBooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { importBooks } = await import("@/lib/actions/books")
    expect(await importBooks(null, formWith("title\nDune"))).toEqual({
      error: "Unauthorized",
    })
  })

  it("rejects an empty file", async () => {
    signedIn()
    const { importBooks } = await import("@/lib/actions/books")
    expect(await importBooks(null, formWith("   "))).toEqual({
      error: "The file is empty",
    })
  })

  it("rejects a file missing the title column", async () => {
    signedIn()
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("isbn\n123"))
    expect(result).toEqual({ error: "CSV is missing a required \"title\" column" })
  })

  it("creates a new book when no match exists", async () => {
    signedIn()
    vi.mocked(findBookMatch).mockResolvedValue(null)
    vi.mocked(createBookRecordReturningId).mockResolvedValue("b1")
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("title,isbn\nDune,123"))
    expect(createBookRecordReturningId).toHaveBeenCalledWith("u1", {
      title: "Dune",
      authors: null,
      isbn: "123",
      description: null,
      coverUrl: null,
    })
    expect(result).toEqual({
      created: 1,
      updated: 0,
      skipped: [],
      importedIds: ["b1"],
    })
  })

  it("skips a row with no title and reports its line", async () => {
    signedIn()
    vi.mocked(findBookMatch).mockResolvedValue(null)
    vi.mocked(createBookRecordReturningId).mockResolvedValue("b1")
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("title,isbn\n,123\nDune,456"))
    expect(result).toMatchObject({
      created: 1,
      updated: 0,
      skipped: [{ line: 2, reason: "Missing title" }],
    })
  })

  it("updates an existing match, preserving fields the CSV leaves blank", async () => {
    signedIn()
    vi.mocked(findBookMatch).mockResolvedValue({
      id: "b9",
      userId: "u1",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "123",
      description: "Existing desc",
      coverUrl: "http://cover",
      genre: null,
      createdAt: new Date(),
    })
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("title,isbn\nDune,123"))
    expect(updateBookRecord).toHaveBeenCalledWith("b9", "u1", {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "123",
      description: "Existing desc",
      coverUrl: "http://cover",
    })
    expect(result).toMatchObject({ created: 0, updated: 1, importedIds: ["b9"] })
  })
})

describe("bulkUpdateBooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { bulkUpdateBooks } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("rows", "[]")
    expect(await bulkUpdateBooks(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("updates each row with non-empty values nulled out", async () => {
    signedIn()
    const { bulkUpdateBooks } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set(
      "rows",
      JSON.stringify([
        { id: "b1", title: "Dune", authors: "Frank Herbert", isbn: "", description: "", coverUrl: "" },
      ])
    )
    const result = await bulkUpdateBooks(null, fd)
    expect(updateBookRecordMock).toHaveBeenCalledWith("b1", "u1", {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(result).toEqual({ updated: 1 })
  })

  it("skips rows missing an id or title", async () => {
    signedIn()
    const { bulkUpdateBooks } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set(
      "rows",
      JSON.stringify([
        { id: "", title: "No id", authors: "", isbn: "", description: "", coverUrl: "" },
        { id: "b2", title: "", authors: "", isbn: "", description: "", coverUrl: "" },
      ])
    )
    const result = await bulkUpdateBooks(null, fd)
    expect(updateBookRecordMock).not.toHaveBeenCalled()
    expect(result).toEqual({ updated: 0 })
  })
})
