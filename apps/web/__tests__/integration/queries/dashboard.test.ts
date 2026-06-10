import { describe, it, expect, beforeEach } from "vitest"
import { getDashboardStats, getRecentActivity } from "@/lib/queries/dashboard"
import { createBookRecordReturningId } from "@/lib/queries/books"
import { createContactRecord, getContactsForUser } from "@/lib/queries/contacts"
import { createCheckoutRecord, getActiveCheckouts, returnBookRecord } from "@/lib/queries/checkouts"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

const bookData = (title: string) => ({
  title,
  authors: null,
  isbn: null,
  description: null,
  coverUrl: null,
})

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("getDashboardStats", () => {
  it("returns zeros for an empty library", async () => {
    expect(await getDashboardStats(USER_ID)).toEqual({
      totalBooks: 0,
      checkedOutNow: 0,
      overdue: 0,
      totalContacts: 0,
    })
  })

  it("counts books, active checkouts, overdue, and contacts", async () => {
    const b1 = await createBookRecordReturningId(USER_ID, bookData("Dune"))
    const b2 = await createBookRecordReturningId(USER_ID, bookData("Emma"))
    await createBookRecordReturningId(USER_ID, bookData("Ulysses"))
    await createContactRecord(USER_ID, { name: "Ada", email: null, phone: null })

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await createCheckoutRecord(USER_ID, { bookId: b1, contactId: null, dueDate: past, notes: null })
    await createCheckoutRecord(USER_ID, { bookId: b2, contactId: null, dueDate: future, notes: null })

    expect(await getDashboardStats(USER_ID)).toEqual({
      totalBooks: 3,
      checkedOutNow: 2,
      overdue: 1,
      totalContacts: 1,
    })
  })

  it("does not count another user's data", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecordReturningId("other", bookData("Hidden"))
    expect((await getDashboardStats(USER_ID)).totalBooks).toBe(0)
  })
})

describe("getRecentActivity", () => {
  it("returns checkout and return events, newest first", async () => {
    const b1 = await createBookRecordReturningId(USER_ID, bookData("Dune"))
    await createContactRecord(USER_ID, { name: "Ada", email: null, phone: null })
    const [contact] = await getContactsForUser(USER_ID)

    await createCheckoutRecord(USER_ID, { bookId: b1, contactId: contact.id, dueDate: null, notes: null })
    const [active] = await getActiveCheckouts(USER_ID)
    await returnBookRecord(active.id, USER_ID)

    const events = await getRecentActivity(USER_ID)
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ type: "return", bookTitle: "Dune", contactName: "Ada" })
    expect(events[1]).toMatchObject({ type: "checkout", bookTitle: "Dune", contactName: "Ada" })
  })

  it("limits the number of events", async () => {
    for (let i = 0; i < 4; i++) {
      const id = await createBookRecordReturningId(USER_ID, bookData(`Book ${i}`))
      await createCheckoutRecord(USER_ID, { bookId: id, contactId: null, dueDate: null, notes: null })
    }
    expect(await getRecentActivity(USER_ID, 3)).toHaveLength(3)
  })
})
