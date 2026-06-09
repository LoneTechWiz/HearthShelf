import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ContactForm } from "@/components/contacts/contact-form"

describe("ContactForm", () => {
  it("renders all fields and the custom submit label", () => {
    render(<ContactForm action={vi.fn().mockResolvedValue(null)} submitLabel="Add Contact" />)
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Add Contact" })
    ).toBeInTheDocument()
  })

  it("prefills values from defaultValues", () => {
    render(
      <ContactForm
        action={vi.fn().mockResolvedValue(null)}
        defaultValues={{ name: "Ada", email: "ada@example.com", phone: null }}
      />
    )
    expect(screen.getByLabelText(/Name/)).toHaveValue("Ada")
    expect(screen.getByLabelText(/Email/)).toHaveValue("ada@example.com")
    expect(screen.getByLabelText(/Phone/)).toHaveValue("")
  })
})
