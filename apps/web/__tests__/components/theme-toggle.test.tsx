import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeToggle variant="sidebar" />
    </ThemeProvider>
  )
}

describe("ThemeToggle", () => {
  it("starts on System and its label points to the next theme", async () => {
    renderToggle()
    expect(
      await screen.findByRole("button", { name: "Switch to Light theme" })
    ).toBeInTheDocument()
  })

  it("cycles System -> Light -> Dark on click", async () => {
    const user = userEvent.setup()
    renderToggle()
    const initial = await screen.findByRole("button", {
      name: "Switch to Light theme",
    })
    await user.click(initial)
    expect(
      await screen.findByRole("button", { name: "Switch to Dark theme" })
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Switch to Dark theme" })
    )
    expect(
      await screen.findByRole("button", { name: "Switch to System theme" })
    ).toBeInTheDocument()
  })
})
