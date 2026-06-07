import Link from "next/link"
import { auth } from "@/auth"
import { getActiveCheckouts, getCheckoutHistory } from "@/lib/queries/checkouts"
import { returnBook } from "@/lib/actions/checkouts"

function formatDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export default async function CheckoutsPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [active, history] = await Promise.all([
    getActiveCheckouts(userId),
    getCheckoutHistory(userId),
  ])

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Active Checkouts</h1>
          <Link
            href="/checkouts/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Check Out a Book
          </Link>
        </div>

        {active.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No books are currently checked out.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((checkout) => (
              <li
                key={checkout.id}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{checkout.book.title}</p>
                    {checkout.book.authors && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{checkout.book.authors}</p>
                    )}
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {checkout.contact
                        ? `Checked out to ${checkout.contact.name}`
                        : "Checked out to yourself"}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Since {formatDate(checkout.checkedOutAt)}
                      {checkout.dueDate && ` · Due ${formatDate(checkout.dueDate)}`}
                    </p>
                    {checkout.notes && (
                      <p className="mt-1 text-xs text-zinc-500 italic dark:text-zinc-400">{checkout.notes}</p>
                    )}
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <form action={returnBook.bind(null, null) as any} className="shrink-0">
                    <input type="hidden" name="checkoutId" value={checkout.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Mark Returned
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-700 dark:text-zinc-300">History</h2>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {history.map((checkout) => (
              <li key={checkout.id} className="px-5 py-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{checkout.book.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {checkout.contact ? checkout.contact.name : "Yourself"} ·{" "}
                  {formatDate(checkout.checkedOutAt)} → {formatDate(checkout.returnedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
