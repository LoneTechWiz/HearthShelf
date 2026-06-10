import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

const replace = vi.fn()
let search = ""
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/books",
  useSearchParams: () => new URLSearchParams(search),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

import { toast } from "sonner"
import { FlashToast } from "@/components/flash-toast"

describe("FlashToast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    search = ""
  })

  it("fires a toast and strips the flash param", () => {
    search = "flash=Book%20added"
    render(<FlashToast />)
    expect(toast.success).toHaveBeenCalledWith("Book added")
    expect(replace).toHaveBeenCalledWith("/books", { scroll: false })
  })

  it("preserves other query params when stripping", () => {
    search = "flash=Saved&view=grid"
    render(<FlashToast />)
    expect(replace).toHaveBeenCalledWith("/books?view=grid", { scroll: false })
  })

  it("does nothing without a flash param", () => {
    render(<FlashToast />)
    expect(toast.success).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })
})
