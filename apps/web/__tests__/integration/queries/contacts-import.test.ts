import { describe, it, expect, beforeEach } from "vitest"
import { createContactRecord, findContactMatch } from "@/lib/queries/contacts"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("findContactMatch", () => {
  it("matches by email when present", async () => {
    await createContactRecord(USER_ID, {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
    })
    const match = await findContactMatch(USER_ID, {
      name: "Totally Different",
      email: "alice@example.com",
    })
    expect(match?.name).toBe("Alice")
  })

  it("falls back to case-insensitive name when email is null", async () => {
    await createContactRecord(USER_ID, {
      name: "Bob",
      email: null,
      phone: null,
    })
    const match = await findContactMatch(USER_ID, { name: "bob", email: null })
    expect(match?.name).toBe("Bob")
  })

  it("returns null when nothing matches", async () => {
    expect(
      await findContactMatch(USER_ID, { name: "Nobody", email: null })
    ).toBeNull()
  })
})
