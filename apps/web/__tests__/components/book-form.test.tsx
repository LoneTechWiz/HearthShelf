import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BookForm } from "@/components/books/book-form"
import { lookupByIsbn, searchByTitle } from "@/lib/open-library"

vi.mock("@/lib/open-library", () => ({
  lookupByIsbn: vi.fn(),
  searchByTitle: vi.fn(),
}))

afterEach(() => vi.clearAllMocks())

describe("BookForm", () => {
  it("fills description after selecting a title search result", async () => {
    vi.mocked(searchByTitle).mockResolvedValue([{
      key: "/works/OL893415W",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      seriesKey: null,
      seriesName: null,
      seriesPosition: null,
      seriesTotal: null,
      genre: "Science fiction",
      coverUrl: null,
      description: null,
    }])
    vi.mocked(lookupByIsbn).mockResolvedValue({
      key: "9780441013593",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      seriesKey: null,
      seriesName: null,
      seriesPosition: null,
      seriesTotal: null,
      genre: "Science fiction",
      coverUrl: null,
      description: "A science fiction novel.",
    })

    render(<BookForm action={vi.fn().mockResolvedValue(null)} />)

    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Dune" } })
    fireEvent.click(await screen.findByRole("button", { name: /Dune/ }))

    await waitFor(() => {
      expect(lookupByIsbn).toHaveBeenCalledWith("9780441013593")
      expect(screen.getByLabelText("Description")).toHaveValue("A science fiction novel.")
    })
  })

  it("fills genre from an ISBN lookup", async () => {
    vi.mocked(lookupByIsbn).mockResolvedValue({
      key: "9780441013593",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      seriesKey: null,
      seriesName: null,
      seriesPosition: null,
      seriesTotal: null,
      genre: "Science fiction",
      coverUrl: null,
      description: null,
    })

    render(<BookForm action={vi.fn().mockResolvedValue(null)} />)

    fireEvent.change(screen.getByLabelText("ISBN"), {
      target: { value: "9780441013593" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lookup" }))

    await waitFor(() => {
      expect(screen.getByLabelText("Genre")).toHaveValue("Science fiction")
    })
  })
})
