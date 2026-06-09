import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CsvImport } from "@/components/csv-import"

const columns = [
  { name: "title", required: true, example: "Dune" },
  { name: "isbn", example: "123" },
]

describe("CsvImport", () => {
  it("renders the file input and expected columns", () => {
    render(
      <CsvImport
        action={vi.fn().mockResolvedValue(null)}
        entity="books"
        columns={columns}
      />
    )
    expect(screen.getByLabelText(/CSV file/i)).toBeInTheDocument()
    expect(screen.getByText(/title/)).toBeInTheDocument()
    expect(screen.getByText(/isbn/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /import/i })).toBeDisabled()
  })

  it("offers a template download link", () => {
    render(
      <CsvImport
        action={vi.fn().mockResolvedValue(null)}
        entity="books"
        columns={columns}
      />
    )
    const link = screen.getByRole("link", { name: /template/i })
    expect(link).toHaveAttribute("download")
  })
})
