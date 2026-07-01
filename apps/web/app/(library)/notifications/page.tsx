import Link from "next/link"
import { auth } from "@/auth"
import { getNotificationsForUser, type ShelfNotification } from "@/lib/notifications"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { btnPrimary } from "@/components/ui/classes"

const KIND_LABELS: Record<ShelfNotification["kind"], string> = {
  contact_request: "Contact request",
  checkout_overdue: "Overdue",
  checkout_due_soon: "Due soon",
  event_upcoming: "Upcoming event",
}

const bellIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.625 2.625 0 01-5.714 0m9.607-2.332c-.861-1.097-1.5-2.358-1.5-4.5a5.25 5.25 0 00-10.5 0c0 2.142-.639 3.403-1.5 4.5a.75.75 0 00.59 1.213h12.32a.75.75 0 00.59-1.213z" />
  </svg>
)

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function NotificationList({ notifications }: { notifications: ShelfNotification[] }) {
  if (notifications.length === 0) return null

  return (
    <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <Link
            href={notification.href}
            className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-surface-raised sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    notification.priority === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  {KIND_LABELS[notification.kind]}
                </span>
                <p className="font-medium text-ink">{notification.title}</p>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{notification.body}</p>
            </div>
            <time className="shrink-0 text-xs text-ink-faint" dateTime={notification.occurredAt.toISOString()}>
              {formatDate(notification.occurredAt)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function NotificationsPage() {
  const session = await auth()
  const notifications = await getNotificationsForUser(session!.user!.id!)
  const highPriority = notifications.filter((notification) => notification.priority === "high")
  const normalPriority = notifications.filter((notification) => notification.priority === "normal")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Updates"
        subtitle={
          notifications.length === 0
            ? "Nothing needs attention right now."
            : `${notifications.length} ${notifications.length === 1 ? "update" : "updates"} from your shelf`
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={bellIcon}
          title="All caught up"
          description="Contact requests, due items, and upcoming events will show up here."
          action={<Link href="/dashboard" className={btnPrimary}>Back Home</Link>}
        />
      ) : (
        <>
          {highPriority.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Needs attention</h2>
              <NotificationList notifications={highPriority} />
            </section>
          )}

          {normalPriority.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Coming up</h2>
              <NotificationList notifications={normalPriority} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
