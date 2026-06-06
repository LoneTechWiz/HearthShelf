import Link from "next/link"
import { auth } from "@/auth"
import { getContactsForUser } from "@/lib/queries/contacts"

export default async function ContactsPage() {
  const session = await auth()
  const contacts = await getContactsForUser(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Contacts</h1>
        <Link
          href="/contacts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Add Contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <p className="text-zinc-500">No contacts yet. Add the people you lend books to.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50"
              >
                <div>
                  <p className="font-medium text-zinc-900">{contact.name}</p>
                  {contact.email && (
                    <p className="text-sm text-zinc-500">{contact.email}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
