import Link from "next/link"
import { ContactForm } from "@/components/contacts/contact-form"
import { createContact, requestUserContact } from "@/lib/actions/contacts"
import { auth } from "@/auth"
import { searchUsersByName } from "@/lib/queries/users"
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui/classes"

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  const { q } = await searchParams
  const query = q?.trim() ?? ""
  const results = session?.user?.id ? await searchUsersByName(session.user.id, query) : []
  const shouldShowSearchState = query.length >= 2

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-ink-muted hover:text-ink">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Add a Contact</h1>
      </div>

      <section className="max-w-2xl">
        <h2 className="font-display text-lg font-semibold text-ink">Find a user</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Search by name and send a contact request. Their email is only shared if they accept.
        </p>
        <form action="/contacts/new" className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="user-search">Search users by name</label>
          <input
            id="user-search"
            name="q"
            type="search"
            minLength={2}
            defaultValue={query}
            placeholder="Search by name"
            className={`sm:max-w-sm ${inputClass}`}
          />
          <button type="submit" className={btnSecondary}>Search</button>
        </form>

        {shouldShowSearchState && (
          <div className="mt-4 rounded-xl border border-edge bg-surface shadow-sm">
            {results.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">
                No users found for &quot;{query}&quot;.
              </p>
            ) : (
              <ul className="divide-y divide-edge">
                {results.map((user) => (
                  <li key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{user.name}</p>
                      <p className="truncate text-sm text-ink-muted">HearthShelf user</p>
                    </div>
                    <form action={requestUserContact}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" className={btnPrimary}>Send request</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Add manually</h2>
        <div className="mt-4">
          <ContactForm action={createContact} submitLabel="Add Contact" />
        </div>
      </section>
    </div>
  )
}
