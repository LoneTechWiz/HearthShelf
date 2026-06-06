import Link from "next/link"
import { auth } from "@/auth"
import { getActiveCheckouts } from "@/lib/queries/checkouts"
import { returnBook } from "@/lib/actions/checkouts"

function formatDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export default async function CheckoutsPage() {
  const session = await auth()
  const active = await getActiveCheckouts(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Active Checkouts</h1>
        <Link
          href="/checkouts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Check Out a Book
        </Link>
      </div>

      {active.length === 0 ? (
        <p className="text-zinc-500">No books are currently checked out.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {active.map((checkout) => (
            <li
              key={checkout.id}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-900">{checkout.book.title}</p>
                  {checkout.book.authors && (
                    <p className="text-sm text-zinc-500">{checkout.book.authors}</p>
                  )}
                  <p className="mt-1 text-sm text-zinc-600">
                    {checkout.contact
                      ? `Checked out to ${checkout.contact.name}`
                      : "Checked out to yourself"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Since {formatDate(checkout.checkedOutAt)}
                    {checkout.dueDate && ` · Due ${formatDate(checkout.dueDate)}`}
                  </p>
                  {checkout.notes && (
                    <p className="mt-1 text-xs text-zinc-500 italic">{checkout.notes}</p>
                  )}
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <form action={returnBook.bind(null, null) as any} className="shrink-0">
                  <input type="hidden" name="checkoutId" value={checkout.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Mark Returned
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
