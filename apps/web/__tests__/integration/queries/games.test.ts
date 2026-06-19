import { describe, it, expect, beforeEach } from "vitest"
import {
  createGameRecord,
  createGameRecordReturningId,
  getGamesForUser,
  getGameById,
  updateGameRecord,
  deleteGameRecord,
} from "@/lib/queries/games"
import { lendableItems, users } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

const gameData = (title: string) => ({
  title,
  coverUrl: null,
  minPlayers: null,
  maxPlayers: null,
  ageRating: null,
  genre: null,
  description: null,
})

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("game queries", () => {
  it("creates a game and reads it back", async () => {
    await createGameRecord(USER_ID, { ...gameData("Catan"), minPlayers: 3, maxPlayers: 4 })
    const games = await getGamesForUser(USER_ID)
    expect(games).toHaveLength(1)
    expect(games[0]).toMatchObject({
      title: "Catan",
      minPlayers: 3,
      maxPlayers: 4,
      isCheckedOut: false,
    })
    expect(games[0].lendableItemId).not.toBeNull()
  })

  it("creates a lendableItem row alongside the game", async () => {
    const id = await createGameRecordReturningId(USER_ID, gameData("Ticket to Ride"))
    const rows = await db
      .select()
      .from(lendableItems)
      .where(and(eq(lendableItems.type, "game"), eq(lendableItems.refId, id)))
    expect(rows).toHaveLength(1)
  })

  it("returns a game by id scoped to user", async () => {
    const id = await createGameRecordReturningId(USER_ID, gameData("Dominion"))
    const game = await getGameById(id, USER_ID)
    expect(game).not.toBeNull()
    expect(game?.title).toBe("Dominion")
  })

  it("returns null for another user's game", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    const id = await createGameRecordReturningId("other", gameData("Hidden"))
    expect(await getGameById(id, USER_ID)).toBeNull()
  })

  it("updates a game", async () => {
    const id = await createGameRecordReturningId(USER_ID, gameData("Catan"))
    await updateGameRecord(id, USER_ID, { ...gameData("Catan: Seafarers"), minPlayers: 3, maxPlayers: 4 })
    const game = await getGameById(id, USER_ID)
    expect(game?.title).toBe("Catan: Seafarers")
  })

  it("deletes a game and its lendableItem", async () => {
    const id = await createGameRecordReturningId(USER_ID, gameData("Temp"))
    await deleteGameRecord(id, USER_ID)
    expect(await getGameById(id, USER_ID)).toBeNull()
    const remaining = await db
      .select()
      .from(lendableItems)
      .where(eq(lendableItems.refId, id))
    expect(remaining).toHaveLength(0)
  })

  it("does not return another user's games", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createGameRecord("other", gameData("Hidden"))
    expect(await getGamesForUser(USER_ID)).toHaveLength(0)
  })
})
