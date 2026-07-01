import Link from "next/link"
import { auth } from "@/auth"
import { getEventsForUser } from "@/lib/queries/events"
import { DeleteEventForm } from "@/components/events/delete-event-form"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { btnPrimary } from "@/components/ui/classes"

const TYPE_LABELS: Record<string, string> = {
  book_club: "Book club",
  movie_night: "Movie night",
  game_night: "Game night",
}

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-time",
  weekly: "Weekly",
  monthly: "Monthly",
}

const calendarIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v11.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5z" />
  </svg>
)

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export default async function EventsPage() {
  const session = await auth()
  const events = await getEventsForUser(session!.user!.id!)

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Plan book clubs, movie nights, and game nights around your shelf."
        actions={<Link href="/events/new" className={btnPrimary}>Create Event</Link>}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={calendarIcon}
          title="No events yet"
          description="Create a recurring book club or a one-off movie or game night."
          action={<Link href="/events/new" className={btnPrimary}>Create Event</Link>}
        />
      ) : (
        <ul className="grid gap-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-edge bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-ink">{event.title}</h2>
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      {TYPE_LABELS[event.type]}
                    </span>
                    <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-muted">
                      {RECURRENCE_LABELS[event.recurrence]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{formatDate(event.startsAt)}</p>
                  {event.items.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {event.items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-full bg-surface-raised px-3 py-1 text-sm text-ink"
                        >
                          {item.title}
                          {item.subtitle && (
                            <span className="text-ink-muted"> · {item.subtitle}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {event.notes && (
                    <p className="mt-2 text-sm leading-6 text-ink-muted">{event.notes}</p>
                  )}
                </div>
                <DeleteEventForm eventId={event.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
