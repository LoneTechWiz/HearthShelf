import { db } from "@/lib/db"
import { games, lendableItems, checkouts } from "@/lib/db/schema"
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"

export type GameRow = typeof games.$inferSelect
export type GameWithAvailability = GameRow & {
  isCheckedOut: boolean
  lendableItemId: string | null
}

export async function getGamesForUser(userId: string): Promise<GameWithAvailability[]> {
  const rows = await db
    .select({
      id: games.id,
      userId: games.userId,
      title: games.title,
      coverUrl: games.coverUrl,
      minPlayers: games.minPlayers,
      maxPlayers: games.maxPlayers,
      ageRating: games.ageRating,
      genre: games.genre,
      description: games.description,
      createdAt: games.createdAt,
      lendableItemId: lendableItems.id,
      activeCheckoutId: checkouts.id,
    })
    .from(games)
    .leftJoin(
      lendableItems,
      and(eq(lendableItems.type, "game"), eq(lendableItems.refId, games.id))
    )
    .leftJoin(
      checkouts,
      and(eq(checkouts.lendableItemId, lendableItems.id), isNull(checkouts.returnedAt))
    )
    .where(eq(games.userId, userId))
    .orderBy(desc(games.createdAt))

  return rows.map(({ activeCheckoutId, ...game }) => ({
    ...game,
    isCheckedOut: activeCheckoutId !== null,
  }))
}

export async function getGameById(
  id: string,
  userId: string
): Promise<GameWithAvailability | null> {
  const rows = await db
    .select({
      id: games.id,
      userId: games.userId,
      title: games.title,
      coverUrl: games.coverUrl,
      minPlayers: games.minPlayers,
      maxPlayers: games.maxPlayers,
      ageRating: games.ageRating,
      genre: games.genre,
      description: games.description,
      createdAt: games.createdAt,
      lendableItemId: lendableItems.id,
      activeCheckoutId: checkouts.id,
    })
    .from(games)
    .leftJoin(
      lendableItems,
      and(eq(lendableItems.type, "game"), eq(lendableItems.refId, games.id))
    )
    .leftJoin(
      checkouts,
      and(eq(checkouts.lendableItemId, lendableItems.id), isNull(checkouts.returnedAt))
    )
    .where(and(eq(games.id, id), eq(games.userId, userId)))
    .limit(1)

  if (!rows[0]) return null
  const { activeCheckoutId, ...game } = rows[0]
  return { ...game, isCheckedOut: activeCheckoutId !== null }
}

type GameData = {
  title: string
  coverUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  ageRating: string | null
  genre: string | null
  description: string | null
}

export async function createGameRecord(userId: string, data: GameData): Promise<void> {
  await db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({ userId, ...data })
      .returning({ id: games.id })
    await tx.insert(lendableItems).values({ userId, type: "game", refId: game.id })
  })
}

export async function createGameRecordReturningId(
  userId: string,
  data: GameData
): Promise<string> {
  let gameId = ""
  await db.transaction(async (tx) => {
    const [game] = await tx
      .insert(games)
      .values({ userId, ...data })
      .returning({ id: games.id })
    gameId = game.id
    await tx.insert(lendableItems).values({ userId, type: "game", refId: game.id })
  })
  return gameId
}

export async function updateGameRecord(
  id: string,
  userId: string,
  data: GameData
): Promise<void> {
  await db
    .update(games)
    .set(data)
    .where(and(eq(games.id, id), eq(games.userId, userId)))
}

export async function deleteGameRecord(id: string, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(lendableItems)
      .where(
        and(
          eq(lendableItems.type, "game"),
          eq(lendableItems.refId, id),
          eq(lendableItems.userId, userId)
        )
      )
    await tx.delete(games).where(and(eq(games.id, id), eq(games.userId, userId)))
  })
}

export async function findGameMatch(
  userId: string,
  row: { title: string }
): Promise<GameRow | null> {
  const rows = await db
    .select()
    .from(games)
    .where(
      and(eq(games.userId, userId), sql`lower(${games.title}) = lower(${row.title})`)
    )
    .limit(1)
  return rows[0] ?? null
}

export async function getGamesByIds(userId: string, ids: string[]): Promise<GameRow[]> {
  if (ids.length === 0) return []
  return db
    .select()
    .from(games)
    .where(and(eq(games.userId, userId), inArray(games.id, ids)))
    .orderBy(desc(games.createdAt))
}
