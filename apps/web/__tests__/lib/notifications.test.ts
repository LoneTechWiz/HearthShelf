import { describe, expect, it } from "vitest"
import { buildNotifications } from "@/lib/notifications"
import type { IncomingContactRequest } from "@/lib/queries/contact-requests"
import type { ActiveCheckout } from "@/lib/queries/checkouts"
import type { ShelfEvent } from "@/lib/queries/events"

const now = new Date("2026-07-01T12:00:00")

function checkout(overrides: Partial<ActiveCheckout>): ActiveCheckout {
  return {
    id: "checkout-1",
    checkedOutAt: new Date("2026-06-20T12:00:00"),
    dueDate: null,
    notes: null,
    item: { id: "book-1", type: "book", title: "Dune", coverUrl: null },
    contact: { id: "contact-1", name: "Ada" },
    ...overrides,
  }
}

function event(overrides: Partial<ShelfEvent>): ShelfEvent {
  return {
    id: "event-1",
    userId: "user-1",
    title: "Game Night",
    type: "game_night",
    startsAt: new Date("2026-07-05T19:00:00"),
    recurrence: "none",
    notes: null,
    createdAt: new Date("2026-06-20T12:00:00"),
    items: [],
    ...overrides,
  }
}

describe("buildNotifications", () => {
  it("creates notifications for contact requests, overdue checkouts, due-soon checkouts, and upcoming events", () => {
    const contactRequest: IncomingContactRequest = {
      id: "request-1",
      createdAt: new Date("2026-07-01T10:00:00"),
      requester: {
        id: "user-2",
        name: "Grace",
        email: "grace@example.com",
        image: null,
      },
    }

    const notifications = buildNotifications({
      contactRequests: [contactRequest],
      checkouts: [
        checkout({ id: "overdue", dueDate: new Date("2026-06-29T12:00:00") }),
        checkout({ id: "soon", dueDate: new Date("2026-07-03T12:00:00") }),
        checkout({ id: "later", dueDate: new Date("2026-07-10T12:00:00") }),
      ],
      events: [
        event({ id: "upcoming", startsAt: new Date("2026-07-04T19:00:00") }),
        event({ id: "past", startsAt: new Date("2026-06-30T19:00:00") }),
        event({ id: "future", startsAt: new Date("2026-07-20T19:00:00") }),
      ],
      now,
    })

    expect(notifications.map((notification) => notification.kind)).toEqual([
      "checkout_overdue",
      "contact_request",
      "checkout_due_soon",
      "event_upcoming",
    ])
    expect(notifications.map((notification) => notification.id)).not.toContain("checkout-due-soon-later")
    expect(notifications.map((notification) => notification.id)).not.toContain("event-upcoming-past")
    expect(notifications.map((notification) => notification.id)).not.toContain("event-upcoming-future")
  })

  it("returns an empty list when nothing needs attention", () => {
    expect(
      buildNotifications({
        contactRequests: [],
        checkouts: [checkout({ dueDate: new Date("2026-07-10T12:00:00") })],
        events: [event({ startsAt: new Date("2026-07-20T19:00:00") })],
        now,
      })
    ).toEqual([])
  })
})
