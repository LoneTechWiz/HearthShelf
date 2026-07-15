import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BookForm } from "@/components/books/book-form"
import { lookupByIsbn } from "@/lib/open-library"

vi.mock("@/lib/open-library", () => ({
  lookupByIsbn: vi.fn(),
  searchByTitle: vi.fn(),
}))

afterEach(() => vi.clearAllMocks())

describe("BookForm", () => {
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
