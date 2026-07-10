import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { GameForm } from "@/components/games/game-form"
import { getGameByBggId, searchGamesByTitle } from "@/lib/bgg"

vi.mock("@/lib/bgg", () => ({
  getGameByBggId: vi.fn(),
  searchGamesByTitle: vi.fn(),
}))

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe("GameForm", () => {
  it("fills the cover URL returned for a selected game", async () => {
    vi.useFakeTimers()
    vi.mocked(searchGamesByTitle).mockResolvedValue([
      { bggId: "13", title: "Catan", year: 1995, coverUrl: "https://example.com/catan.jpg" },
    ])
    vi.mocked(getGameByBggId).mockResolvedValue({
      title: "Catan",
      coverUrl: "https://example.com/catan.jpg",
      minPlayers: 3,
      maxPlayers: 4,
      ageRating: "10+",
      genre: "Economic",
      description: "Build settlements.",
    })

    render(<GameForm action={vi.fn().mockResolvedValue(null)} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Catan" } })
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(screen.getByRole("presentation")).toHaveAttribute("src", "https://example.com/catan.jpg")

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Catan/ }))
    })

    expect(screen.getByLabelText(/Cover Image URL/)).toHaveValue("https://example.com/catan.jpg")
  })
})
