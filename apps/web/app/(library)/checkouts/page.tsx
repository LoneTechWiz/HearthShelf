import Link from "next/link"
import { auth } from "@/auth"
import { getActiveCheckouts, getCheckoutHistory } from "@/lib/queries/checkouts"
import { returnItem } from "@/lib/actions/checkouts"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { btnPrimary, btnSecondarySm } from "@/components/ui/classes"

function formatDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

const TYPE_LABELS: Record<string, string> = { book: "Book", movie: "Movie", game: "Game" }

const arrowsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
)

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
        <PageHeader
          title="Active Checkouts"
          actions={<Link href="/checkouts/new" className={btnPrimary}>Check Out an Item</Link>}
        />

        {active.length === 0 ? (
          <EmptyState
            icon={arrowsIcon}
            title="Nothing checked out"
            description="All your items are home on the shelf."
            action={<Link href="/checkouts/new" className={btnPrimary}>Check Out an Item</Link>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((checkout) => (
              <li key={checkout.id} className="rounded-xl border border-edge bg-surface px-5 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{checkout.item.title}</p>
                      <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-muted">
                        {TYPE_LABELS[checkout.item.type]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {checkout.contact
                        ? `Checked out to ${checkout.contact.name}`
                        : "Checked out to yourself"}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Since {formatDate(checkout.checkedOutAt)}
                      {checkout.dueDate && (
                        <>
                          {" · "}
                          <span className={checkout.dueDate < new Date() ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                            Due {formatDate(checkout.dueDate)}
                          </span>
                        </>
                      )}
                    </p>
                    {checkout.notes && (
                      <p className="mt-1 text-xs text-ink-muted italic">{checkout.notes}</p>
                    )}
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <form action={returnItem.bind(null, null) as any} className="shrink-0">
                    <input type="hidden" name="checkoutId" value={checkout.id} />
                    <button type="submit" className={btnSecondarySm}>Mark Returned</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">History</h2>
          <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
            {history.map((checkout) => (
              <li key={checkout.id} className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{checkout.item.title}</p>
                  <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-muted">
                    {TYPE_LABELS[checkout.item.type]}
                  </span>
                </div>
                <p className="text-sm text-ink-muted">
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
