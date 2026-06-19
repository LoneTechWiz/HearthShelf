import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

// ── Auth tables (unchanged) ────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
)

// ── App tables ─────────────────────────────────────────────────────────────

export const books = pgTable("book", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isbn: text("isbn"),
  title: text("title").notNull(),
  authors: text("authors"),
  description: text("description"),
  coverUrl: text("coverUrl"),
  genre: text("genre"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
})

export const movies = pgTable("movie", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  director: text("director"),
  year: integer("year"),
  posterUrl: text("posterUrl"),
  format: text("format"),
  genre: text("genre"),
  runtime: integer("runtime"),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
})

export const games = pgTable("game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coverUrl: text("coverUrl"),
  minPlayers: integer("minPlayers"),
  maxPlayers: integer("maxPlayers"),
  ageRating: text("ageRating"),
  genre: text("genre"),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
})

// Bridge table — one row per lendable item; unique on (type, refId)
// userId is required for cascade delete: user → lendableItem → checkout.
// There is no polymorphic FK from refId back to book/movie/game, so without
// userId the lendableItem rows would be orphaned on user deletion.
export const lendableItems = pgTable(
  "lendableItem",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"book" | "movie" | "game">().notNull(),
    refId: text("refId").notNull(),
  },
  (t) => [unique().on(t.type, t.refId)]
)

export const contacts = pgTable("contact", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
})

// ── BGG cache tables ───────────────────────────────────────────────────────

export const bggSearchCache = pgTable("bgg_search_cache", {
  query: text("query").primaryKey(),
  results: jsonb("results").notNull(),
  cachedAt: timestamp("cached_at", { withTimezone: true }).notNull(),
})

export const bggGameCache = pgTable("bgg_game_cache", {
  bggId: text("bgg_id").primaryKey(),
  data: jsonb("data").notNull(),
  cachedAt: timestamp("cached_at", { withTimezone: true }).notNull(),
})

export const checkouts = pgTable("checkout", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lendableItemId: text("lendableItemId")
    .notNull()
    .references(() => lendableItems.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: text("contactId").references(() => contacts.id, {
    onDelete: "set null",
  }), // null = owner has the item themselves
  checkedOutAt: timestamp("checkedOutAt", { mode: "date" })
    .defaultNow()
    .notNull(),
  dueDate: timestamp("dueDate", { mode: "date" }),
  returnedAt: timestamp("returnedAt", { mode: "date" }),
  notes: text("notes"),
})
