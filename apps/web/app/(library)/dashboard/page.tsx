import Link from "next/link"
import { auth } from "@/auth"
import { getDashboardStats, getRecentActivity } from "@/lib/queries/dashboard"
import { getActiveCheckouts } from "@/lib/queries/checkouts"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [stats, activity, active] = await Promise.all([
    getDashboardStats(userId),
    getRecentActivity(userId),
    getActiveCheckouts(userId),
  ])

  const firstName = session!.user!.name?.split(" ")[0]

  if (stats.totalBooks === 0) {
    return (
      <div>
        <PageHeader title={firstName ? `Welcome, ${firstName}` : "Welcome"} />
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="Let's stock your shelf"
          description="Add your first book by hand, or import your whole library from a CSV."
          action={
            <>
              <Link href="/books/new" className={btnPrimary}>Add Book</Link>
              <Link href="/books/import" className={btnSecondary}>Import CSV</Link>
            </>
          }
        />
      </div>
    )
  }

  const cards = [
    { label: "Books", value: stats.totalBooks, href: "/books" },
    { label: "Checked out", value: stats.checkedOutNow, href: "/checkouts" },
    { label: "Overdue", value: stats.overdue, href: "/checkouts", alert: stats.overdue > 0 },
    { label: "Contacts", value: stats.totalContacts, href: "/contacts" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        actions={
          <>
            <Link href="/books/new" className={btnSecondary}>Add Book</Link>
            <Link href="/checkouts/new" className={btnPrimary}>Check Out</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-edge bg-surface p-4 shadow-sm transition-colors hover:bg-surface-raised"
          >
            <p className="text-sm text-ink-muted">{card.label}</p>
            <p
              className={`font-display text-3xl font-semibold ${
                card.alert ? "text-red-600 dark:text-red-400" : "text-ink"
              }`}
            >
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Currently out</h2>
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge bg-surface px-5 py-8 text-center text-sm text-ink-muted">
              All your books are home on the shelf.
            </p>
          ) : (
            <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
              {active.map((checkout) => {
                const overdue = checkout.dueDate !== null && checkout.dueDate < new Date()
                return (
                  <li key={checkout.id}>
                    <Link href={`/books/${checkout.book.id}`} className="block px-5 py-3 hover:bg-surface-raised">
                      <p className="truncate text-sm font-medium text-ink">{checkout.book.title}</p>
                      <p className="text-xs text-ink-muted">
                        {checkout.contact ? checkout.contact.name : "Yourself"}
                        {checkout.dueDate && (
                          <>
                            {" · "}
                            <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                              Due {formatDate(checkout.dueDate)}
                            </span>
                          </>
                        )}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge bg-surface px-5 py-8 text-center text-sm text-ink-muted">
              No lending activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
              {activity.map((event) => (
                <li key={`${event.checkoutId}-${event.type}`} className="px-5 py-3">
                  <p className="text-sm text-ink">
                    <Link href={`/books/${event.bookId}`} className="font-medium hover:text-accent">
                      {event.bookTitle}
                    </Link>{" "}
                    {event.type === "checkout"
                      ? `checked out to ${event.contactName ?? "yourself"}`
                      : `returned by ${event.contactName ?? "you"}`}
                  </p>
                  <p className="text-xs text-ink-faint">{formatDate(event.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
