import { createHash, randomBytes } from "crypto"
import { db } from "@/lib/db"
import { mobileAuthCodes, mobileSessions, users } from "@/lib/db/schema"
import { and, eq, gt } from "drizzle-orm"

const AUTH_CODE_BYTES = 32
const SESSION_TOKEN_BYTES = 32
const AUTH_CODE_TTL_MS = 10 * 60 * 1000
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000

function randomToken(bytes: number): string {
  return randomBytes(bytes).toString("base64url")
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createMobileAuthCode(
  userId: string,
  redirectUri: string
): Promise<string> {
  const code = randomToken(AUTH_CODE_BYTES)
  await db.insert(mobileAuthCodes).values({
    codeHash: hashToken(code),
    userId,
    redirectUri,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
  })
  return code
}

export async function exchangeMobileAuthCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; expiresAt: Date } | null> {
  const codeHash = hashToken(code)
  const [authCode] = await db
    .select()
    .from(mobileAuthCodes)
    .where(
      and(
        eq(mobileAuthCodes.codeHash, codeHash),
        eq(mobileAuthCodes.redirectUri, redirectUri),
        gt(mobileAuthCodes.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!authCode) return null

  const token = randomToken(SESSION_TOKEN_BYTES)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.transaction(async (tx) => {
    await tx.delete(mobileAuthCodes).where(eq(mobileAuthCodes.codeHash, codeHash))
    await tx.insert(mobileSessions).values({
      tokenHash: hashToken(token),
      userId: authCode.userId,
      expiresAt,
    })
  })

  return { token, expiresAt }
}

export async function getUserForMobileToken(token: string) {
  const [row] = await db
    .select({
      tokenHash: mobileSessions.tokenHash,
      userId: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(mobileSessions)
    .innerJoin(users, eq(mobileSessions.userId, users.id))
    .where(
      and(
        eq(mobileSessions.tokenHash, hashToken(token)),
        gt(mobileSessions.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!row) return null

  await db
    .update(mobileSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(mobileSessions.tokenHash, row.tokenHash))

  return {
    id: row.userId,
    name: row.name,
    email: row.email,
    image: row.image,
  }
}

export async function revokeMobileToken(token: string): Promise<void> {
  await db.delete(mobileSessions).where(eq(mobileSessions.tokenHash, hashToken(token)))
}
