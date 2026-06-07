import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

export { db }

export async function truncateAll() {
  await db.execute(
    sql`TRUNCATE TABLE "checkout","book","contact","session","account","verificationToken","user" RESTART IDENTITY CASCADE`
  )
}
