import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getContactById } from "@/lib/queries/contacts"
import { DeleteContactForm } from "@/components/contacts/delete-contact-form"

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
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to contacts
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{contact.name}</h1>
            {contact.email && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{contact.email}</p>
            )}
            {contact.phone && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{contact.phone}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
