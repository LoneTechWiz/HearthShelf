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

const ITEM_HREF: Record<string, string> = {
  book: "/books",
  movie: "/movies",
  game: "/games",
}

const collectionOverview = [
  {
    label: "Books",
    href: "/books",
    addHref: "/books/new",
    importHref: "/books/import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    label: "Movies",
    href: "/movies",
    addHref: "/movies/new",
    importHref: "/movies/import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
  {
    label: "Games",
    href: "/games",
    addHref: "/games/new",
    importHref: "/games/import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    ),
  },
]

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [stats, activity, active] = await Promise.all([
    getDashboardStats(userId),
    getRecentActivity(userId),
    getActiveCheckouts(userId),
  ])

  const firstName = session!.user!.name?.split(" ")[0]
  const totalItems = stats.totalBooks + stats.totalMovies + stats.totalGames
  const collectionCounts: Record<string, number> = {
    Books: stats.totalBooks,
    Movies: stats.totalMovies,
    Games: stats.totalGames,
  }

  if (totalItems === 0) {
    return (
      <div>
        <PageHeader
          title={firstName ? `Welcome, ${firstName}` : "Welcome"}
          subtitle="Start with any kind of item you lend out."
        />
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25h4.75v13.5H4.5a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5zM9.25 5.25h5.5v13.5h-5.5M14.75 5.25h4.75a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5h-4.75" />
            </svg>
          }
          title="Build your collection"
          description="Track books, movies, and games from the same shelf."
          action={
            <>
              <Link href="/books/new" className={btnPrimary}>Add Book</Link>
              <Link href="/movies/new" className={btnSecondary}>Add Movie</Link>
              <Link href="/games/new" className={btnSecondary}>Add Game</Link>
            </>
          }
        />
      </div>
    )
  }

  const cards = [
    { label: "Books", value: stats.totalBooks, href: "/books" },
    { label: "Movies", value: stats.totalMovies, href: "/movies" },
    { label: "Games", value: stats.totalGames, href: "/games" },
    { label: "Checked out", value: stats.checkedOutNow, href: "/checkouts" },
    { label: "Overdue", value: stats.overdue, href: "/checkouts", alert: stats.overdue > 0 },
    { label: "Contacts", value: stats.totalContacts, href: "/contacts" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        subtitle={`${totalItems} ${totalItems === 1 ? "item" : "items"} across books, movies, and games.`}
        actions={
          <>
            <Link href="/books/new" className={btnSecondary}>Add Book</Link>
            <Link href="/movies/new" className={btnSecondary}>Add Movie</Link>
            <Link href="/games/new" className={btnSecondary}>Add Game</Link>
            <Link href="/checkouts/new" className={btnPrimary}>Check Out</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Your collections</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {collectionOverview.map((collection) => (
            <div
              key={collection.label}
              className="rounded-xl border border-edge bg-surface p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-muted">{collection.label}</p>
                  <p className="font-display text-3xl font-semibold text-ink">
                    {collectionCounts[collection.label]}
                  </p>
                </div>
                <span className="rounded-lg bg-accent-soft p-2 text-accent [&>svg]:h-6 [&>svg]:w-6">
                  {collection.icon}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={collection.href} className={btnSecondary}>View</Link>
                <Link href={collection.addHref} className={btnSecondary}>Add</Link>
                <Link href={collection.importHref} className={btnSecondary}>Import</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Currently out</h2>
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge bg-surface px-5 py-8 text-center text-sm text-ink-muted">
              All your items are home on the shelf.
            </p>
          ) : (
            <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
              {active.map((checkout) => {
                const overdue = checkout.dueDate !== null && checkout.dueDate < new Date()
                const itemHref = `${ITEM_HREF[checkout.item.type] ?? "/books"}/${checkout.item.id}`
                return (
                  <li key={checkout.id}>
                    <Link href={itemHref} className="block px-5 py-3 hover:bg-surface-raised">
                      <p className="truncate text-sm font-medium text-ink">{checkout.item.title}</p>
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
              {activity.map((event) => {
                const itemHref = `${ITEM_HREF[event.itemType] ?? "/books"}/${event.itemId}`
                return (
                  <li key={`${event.checkoutId}-${event.type}`} className="px-5 py-3">
                    <p className="text-sm text-ink">
                      <Link href={itemHref} className="font-medium hover:text-accent">
                        {event.itemTitle}
                      </Link>{" "}
                      {event.type === "checkout"
                        ? `checked out to ${event.contactName ?? "yourself"}`
                        : `returned by ${event.contactName ?? "you"}`}
                    </p>
                    <p className="text-xs text-ink-faint">{formatDate(event.at)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
