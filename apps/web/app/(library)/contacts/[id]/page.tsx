import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getContactById } from "@/lib/queries/contacts"
import { DeleteContactForm } from "@/components/contacts/delete-contact-form"
import { btnSecondary } from "@/components/ui/classes"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const contact = await getContactById(id, session!.user!.id!)
  if (!contact) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-ink-muted hover:text-ink">
          ← Back to contacts
        </Link>
      </div>

      <div className="rounded-xl border border-edge bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{contact.name}</h1>
            {contact.email && (
              <p className="mt-1 text-sm text-ink-muted">{contact.email}</p>
            )}
            {contact.phone && (
              <p className="mt-1 text-sm text-ink-muted">{contact.phone}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className={btnSecondary}
            >
              Edit
            </Link>
            <DeleteContactForm contactId={contact.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
