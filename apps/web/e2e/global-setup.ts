import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import * as schema from "../lib/db/schema"

const SESSION_COOKIE = "authjs.session-token"

async function globalSetup() {
  const userId = "e2e-user"
  const sessionToken = randomUUID()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client, { schema })
  try {
    await db.execute(
      sql`TRUNCATE TABLE "checkout","book","contact","session","account","verificationToken","user" RESTART IDENTITY CASCADE`
    )
    await db
      .insert(schema.users)
      .values({ id: userId, email: "e2e@example.com", name: "E2E User" })
    await db.insert(schema.sessions).values({ sessionToken, userId, expires })
  } finally {
    await client.end()
  }

  const storageState = {
    cookies: [
      {
        name: SESSION_COOKIE,
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
        expires: Math.floor(expires.getTime() / 1000),
      },
    ],
    origins: [],
  }

  const out = path.join(process.cwd(), "playwright", ".auth", "user.json")
  mkdirSync(path.dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(storageState, null, 2))
}

export default globalSetup
