import Link from "next/link"
import { ContactForm } from "@/components/contacts/contact-form"
import { createContact } from "@/lib/actions/contacts"

export default function NewContactPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Add a Contact</h1>
      </div>
      <ContactForm action={createContact} submitLabel="Add Contact" />
    </div>
  )
}
