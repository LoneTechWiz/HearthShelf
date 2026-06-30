import { describe, it, expect, beforeEach } from "vitest"
import { createContactRecord } from "@/lib/queries/contacts"
import { getUserContactCandidate, searchUsersByName } from "@/lib/queries/users"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values([
    { id: USER_ID, name: "Owner", email: "owner@example.com" },
    { id: "alice", name: "Alice Reader", email: "alice@example.com" },
    { id: "alicia", name: "Alicia Viewer", email: "alicia@example.com" },
    { id: "bob", name: "Bob Friend", email: "bob@example.com" },
    { id: "nameless", name: null, email: "nameless@example.com" },
  ])
})

describe("searchUsersByName", () => {
  it("finds users by partial name and excludes the current user", async () => {
    const results = await searchUsersByName(USER_ID, "ali")
    expect(results.map((user) => user.id)).toEqual(["alice", "alicia"])
  })

  it("returns no results for short queries", async () => {
    expect(await searchUsersByName(USER_ID, "a")).toEqual([])
  })

  it("excludes users already represented by an existing contact", async () => {
    await createContactRecord(USER_ID, {
      name: "Alice Reader",
      email: "alice@example.com",
      phone: null,
    })

    const results = await searchUsersByName(USER_ID, "ali")
    expect(results.map((user) => user.id)).toEqual(["alicia"])
  })
})

describe("getUserContactCandidate", () => {
  it("returns a user that can be added as a contact", async () => {
    await expect(getUserContactCandidate("alice", USER_ID)).resolves.toMatchObject({
      id: "alice",
      name: "Alice Reader",
      email: "alice@example.com",
    })
  })

  it("does not return the current user", async () => {
    await expect(getUserContactCandidate(USER_ID, USER_ID)).resolves.toBeNull()
  })
})
