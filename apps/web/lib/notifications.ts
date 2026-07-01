import {
  getIncomingContactRequests,
  type IncomingContactRequest,
} from "@/lib/queries/contact-requests"
import { getActiveCheckouts, type ActiveCheckout } from "@/lib/queries/checkouts"
import { getEventsForUser, type ShelfEvent } from "@/lib/queries/events"

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DUE_SOON_DAYS = 3
const UPCOMING_EVENT_DAYS = 7

export type NotificationKind =
  | "contact_request"
  | "checkout_overdue"
  | "checkout_due_soon"
  | "event_upcoming"

export type ShelfNotification = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  href: string
  occurredAt: Date
  priority: "high" | "normal"
}

export type NotificationInputs = {
  contactRequests: IncomingContactRequest[]
  checkouts: ActiveCheckout[]
  events: ShelfEvent[]
  now?: Date
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysFromNow(date: Date, now: Date): number {
  return Math.ceil((startOfDay(date).getTime() - startOfDay(now).getTime()) / MS_PER_DAY)
}

function formatDueDate(date: Date, now: Date): string {
  const days = daysFromNow(date, now)
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue`
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return `Due in ${days} days`
}

function formatEventDate(date: Date, now: Date): string {
  const days = daysFromNow(date, now)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `In ${days} days`
}

function itemHolder(checkout: ActiveCheckout): string {
  return checkout.contact ? checkout.contact.name : "you"
}

export function buildNotifications({
  contactRequests,
  checkouts,
  events,
  now = new Date(),
}: NotificationInputs): ShelfNotification[] {
  const notifications: ShelfNotification[] = []

  for (const request of contactRequests) {
    notifications.push({
      id: `contact-request-${request.id}`,
      kind: "contact_request",
      title: `${request.requester.name} wants to connect`,
      body: "Accept or decline this contact request.",
      href: "/contacts",
      occurredAt: request.createdAt,
      priority: "high",
    })
  }

  for (const checkout of checkouts) {
    if (!checkout.dueDate) continue

    const days = daysFromNow(checkout.dueDate, now)
    if (days < 0) {
      notifications.push({
        id: `checkout-overdue-${checkout.id}`,
        kind: "checkout_overdue",
        title: `${checkout.item.title} is overdue`,
        body: `${formatDueDate(checkout.dueDate, now)} with ${itemHolder(checkout)}.`,
        href: "/checkouts",
        occurredAt: checkout.dueDate,
        priority: "high",
      })
      continue
    }

    if (days <= DUE_SOON_DAYS) {
      notifications.push({
        id: `checkout-due-soon-${checkout.id}`,
        kind: "checkout_due_soon",
        title: `${checkout.item.title} is due soon`,
        body: `${formatDueDate(checkout.dueDate, now)} with ${itemHolder(checkout)}.`,
        href: "/checkouts",
        occurredAt: checkout.dueDate,
        priority: "normal",
      })
    }
  }

  for (const event of events) {
    const days = daysFromNow(event.startsAt, now)
    if (days < 0 || days > UPCOMING_EVENT_DAYS) continue

    notifications.push({
      id: `event-upcoming-${event.id}`,
      kind: "event_upcoming",
      title: event.title,
      body: `${formatEventDate(event.startsAt, now)} on your event calendar.`,
      href: "/events",
      occurredAt: event.startsAt,
      priority: "normal",
    })
  }

  return notifications.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1
    return a.occurredAt.getTime() - b.occurredAt.getTime()
  })
}

export async function getNotificationsForUser(userId: string): Promise<ShelfNotification[]> {
  const [contactRequests, checkouts, events] = await Promise.all([
    getIncomingContactRequests(userId),
    getActiveCheckouts(userId),
    getEventsForUser(userId),
  ])

  return buildNotifications({ contactRequests, checkouts, events })
}
