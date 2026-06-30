import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ItemReviewPanel } from "@/components/reviews/item-review-panel"

vi.mock("@/lib/actions/reviews", () => ({
  removeReview: vi.fn(),
  saveReview: vi.fn(),
}))

describe("ItemReviewPanel", () => {
  it("defaults to no rating and uses clickable stars to update the hidden rating", async () => {
    const user = userEvent.setup()
    render(<ItemReviewPanel lendableItemId="li1" returnPath="/books/b1" review={null} />)

    const form = screen.getByRole("button", { name: "Save review" }).closest("form")
    expect(form).not.toBeNull()
    expect(screen.getByText("No rating selected")).toBeInTheDocument()
    expect(form?.querySelector<HTMLInputElement>('input[name="rating"]')?.value).toBe("")

    await user.click(screen.getByRole("radio", { name: "3 out of 5" }))

    expect(screen.getByText("3 out of 5")).toBeInTheDocument()
    expect(form?.querySelector<HTMLInputElement>('input[name="rating"]')?.value).toBe("3")
  })
})
