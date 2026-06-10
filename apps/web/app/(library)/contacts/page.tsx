import Link from "next/link"
import { auth } from "@/auth"
import { getContactsForUser } from "@/lib/queries/contacts"

export default async function ContactsPage() {
  const session = await auth()
  const contacts = await getContactsForUser(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Contacts</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/contacts/import"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Import CSV
          </Link>
          <Link
            href="/contacts/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Contact
          </Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No contacts yet. Add the people you lend books to.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{contact.name}</p>
                  {contact.email && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{contact.email}</p>
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
