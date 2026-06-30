import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

export { db }

export async function truncateAll() {
  await db.execute(
    sql`TRUNCATE TABLE "checkout","lendableItem","movie","game","book","contactRequest","contact","session","account","verificationToken","user" RESTART IDENTITY CASCADE`
  )
}
