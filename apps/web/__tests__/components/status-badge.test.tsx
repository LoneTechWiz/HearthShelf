import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/ui/status-badge"

describe("StatusBadge", () => {
  it("renders the label for each status", () => {
    const { rerender } = render(<StatusBadge status="available" />)
    expect(screen.getByText("Available")).toBeInTheDocument()
    rerender(<StatusBadge status="checked-out" />)
    expect(screen.getByText("Checked out")).toBeInTheDocument()
    rerender(<StatusBadge status="overdue" />)
    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })

  it("renders a decorative dot that is aria-hidden", () => {
    const { container } = render(<StatusBadge status="available" />)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })
})
