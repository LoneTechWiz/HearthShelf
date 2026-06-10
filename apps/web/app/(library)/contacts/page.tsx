import Link from "next/link"
import { auth } from "@/auth"
import { getContactsForUser } from "@/lib/queries/contacts"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

const personIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

export default async function ContactsPage() {
  const session = await auth()
  const contacts = await getContactsForUser(session!.user!.id!)

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}`}
        actions={
          <>
            <Link href="/contacts/import" className={btnSecondary}>Import CSV</Link>
            <Link href="/contacts/new" className={btnPrimary}>Add Contact</Link>
          </>
        }
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon={personIcon}
          title="No contacts yet"
          description="Add the people you lend books to."
          action={<Link href="/contacts/new" className={btnPrimary}>Add Contact</Link>}
        />
      ) : (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface-raised"
              >
                <div>
                  <p className="font-medium text-ink">{contact.name}</p>
                  {contact.email && (
                    <p className="text-sm text-ink-muted">{contact.email}</p>
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
