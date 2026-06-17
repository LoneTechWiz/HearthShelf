import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Cache the client across Next.js dev-mode hot reloads. Without this, every
// Fast Refresh re-evaluates this module and opens a new connection pool
// without closing the old one, leaking sessions until Supabase's pooler
// limit is exhausted.
const globalForDb = globalThis as unknown as { dbClient?: ReturnType<typeof postgres> }

const client = globalForDb.dbClient ?? postgres(process.env.DATABASE_URL!, {
  max: 1,
  prepare: false, // required for Supabase transaction-mode pooler (port 6543)
})

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbClient = client
}

export const db = drizzle(client, { schema })
