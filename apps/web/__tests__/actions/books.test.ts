import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/books")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createBookRecord } from "@/lib/queries/books"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

describe("createBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { createBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "Test Book")
    const result = await createBook(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
    expect(createBookRecord).not.toHaveBeenCalled()
  })

  it("returns error when title is empty", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { createBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "   ")
    const result = await createBook(null, fd)
    expect(result).toEqual({ error: "Title is required" })
  })

  it("calls createBookRecord with userId and parsed fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    vi.mocked(createBookRecord).mockResolvedValue()
    const { createBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "Dune")
    fd.set("authors", "Frank Herbert")
    fd.set("isbn", "9780441013593")
    const result = await createBook(null, fd)
    expect(createBookRecord).toHaveBeenCalledWith("u1", {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/books")
    expect(redirect).toHaveBeenCalledWith("/books")
    expect(result).toBeNull()
  })
})

describe("deleteBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { deleteBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    const result = await deleteBook(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error when id is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    const result = await deleteBook(null, fd)
    expect(result).toEqual({ error: "Missing book id" })
  })

  it("calls deleteBookRecord with id and userId and redirects", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { deleteBookRecord } = await import("@/lib/queries/books")
    vi.mocked(deleteBookRecord).mockResolvedValue()
    const { deleteBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    await deleteBook(null, fd)
    expect(deleteBookRecord).toHaveBeenCalledWith("book1", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/books")
    expect(redirect).toHaveBeenCalledWith("/books")
  })
})

describe("updateBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    fd.set("title", "New Title")
    const result = await updateBook(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error when id is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "Some Title")
    const result = await updateBook(null, fd)
    expect(result).toEqual({ error: "Missing book id" })
  })

  it("returns error when title is empty", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    fd.set("title", "")
    const result = await updateBook(null, fd)
    expect(result).toEqual({ error: "Title is required" })
  })

  it("calls updateBookRecord and redirects to book detail", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)
    const { updateBookRecord } = await import("@/lib/queries/books")
    vi.mocked(updateBookRecord).mockResolvedValue()
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    fd.set("title", "Updated Title")
    fd.set("authors", "Author")
    await updateBook(null, fd)
    expect(updateBookRecord).toHaveBeenCalledWith("book1", "u1", {
      title: "Updated Title",
      authors: "Author",
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/books/book1")
    expect(revalidatePath).toHaveBeenCalledWith("/books")
    expect(redirect).toHaveBeenCalledWith("/books/book1")
  })
})
