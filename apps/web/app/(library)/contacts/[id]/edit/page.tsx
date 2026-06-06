import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getContactById } from "@/lib/queries/contacts"
import { updateContact } from "@/lib/actions/contacts"
import { ContactForm } from "@/components/contacts/contact-form"

export default async function EditContactPage({
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
        <Link href={`/contacts/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to contact
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Edit Contact</h1>
      </div>
      <ContactForm
        action={updateContact}
        defaultValues={contact}
        submitLabel="Save Changes"
      />
    </div>
  )
}
