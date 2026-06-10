import Link from "next/link"
import { ContactForm } from "@/components/contacts/contact-form"
import { createContact } from "@/lib/actions/contacts"

export default function NewContactPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-ink-muted hover:text-ink">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Add a Contact</h1>
      </div>
      <ContactForm action={createContact} submitLabel="Add Contact" />
    </div>
  )
}
