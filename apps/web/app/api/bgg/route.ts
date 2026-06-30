import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { XMLParser } from "fast-xml-parser"
import { db } from "@/lib/db"
import { bggSearchCache, bggGameCache } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { GameDetail } from "@/lib/bgg"
import { combineGameSuggestions, parseBggSearchXml } from "@/lib/bgg-search"

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000      // 1 day
const DETAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

type BggNameNode = {
  "@_type"?: string
  "@_value"?: string
}

type BggLinkNode = {
  "@_type"?: string
  "@_value"?: string
}

type BggDetailItem = {
  name?: BggNameNode | BggNameNode[]
  image?: string
  link?: BggLinkNode | BggLinkNode[]
  minage?: { "@_value"?: string | number }
  minplayers?: { "@_value"?: string | number }
  maxplayers?: { "@_value"?: string | number }
  description?: string | { __cdata?: string }
}

function parseDetail(xml: string): GameDetail | null {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", cdataPropName: "__cdata" })
  const doc = parser.parse(xml)
  const item = doc?.items?.item as BggDetailItem | undefined
  if (!item) return null

  const names = Array.isArray(item.name) ? item.name : [item.name]
  const primaryName = names.find((name) => name?.["@_type"] === "primary") ?? names[0]
  const title = primaryName?.["@_value"] ?? ""

  const rawImage = item.image ?? null
  const coverUrl = rawImage
    ? String(rawImage).startsWith("http") ? String(rawImage) : `https:${rawImage}`
    : null

  const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []
  const category = links.find((link) => link?.["@_type"] === "boardgamecategory")

  const minAge = parseInt(String(item.minage?.["@_value"] ?? "")) || null

  // BGG description is HTML-escaped plain text in a CDATA section
  const rawDesc = typeof item.description === "object"
    ? item.description.__cdata ?? null
    : item.description ?? null
  const description = rawDesc ? String(rawDesc).trim() || null : null

  return {
    title,
    coverUrl,
    minPlayers: parseInt(String(item.minplayers?.["@_value"] ?? "")) || null,
    maxPlayers: parseInt(String(item.maxplayers?.["@_value"] ?? "")) || null,
    ageRating: minAge ? `${minAge}+` : null,
    genre: category?.["@_value"] ?? null,
    description,
  }
}

async function fetchBgg(url: string, apiKey: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/xml,text/xml,*/*",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`BGG upstream error: ${res.status} ${res.statusText}`, body.slice(0, 200))
    return null
  }
  return res.text()
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.BGG_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "BGG_API_KEY not configured" }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const query = searchParams.get("query")

  if (!id && !query) {
    return NextResponse.json({ error: "Missing id or query parameter" }, { status: 400 })
  }

  const now = new Date()

  if (query) {
    const cacheKey = `v4:${query.trim().toLowerCase()}`

    // Check search cache
    const [cached] = await db.select().from(bggSearchCache).where(eq(bggSearchCache.query, cacheKey))
    if (cached && now.getTime() - cached.cachedAt.getTime() < SEARCH_TTL_MS) {
      return NextResponse.json(cached.results)
    }

    const [exactXml, broadXml] = await Promise.all([
      fetchBgg(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame&exact=1`,
        apiKey
      ),
      fetchBgg(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`,
        apiKey
      ),
    ])
    if (!exactXml && !broadXml) return NextResponse.json({ error: "BGG request failed" }, { status: 502 })

    const results = combineGameSuggestions(
      query,
      exactXml ? parseBggSearchXml(exactXml) : [],
      broadXml ? parseBggSearchXml(broadXml) : []
    )

    await db
      .insert(bggSearchCache)
      .values({ query: cacheKey, results, cachedAt: now })
      .onConflictDoUpdate({ target: bggSearchCache.query, set: { results, cachedAt: now } })

    return NextResponse.json(results)
  }

  // Game detail by BGG ID
  const [cached] = await db.select().from(bggGameCache).where(eq(bggGameCache.bggId, id!))
  if (cached && now.getTime() - cached.cachedAt.getTime() < DETAIL_TTL_MS) {
    return NextResponse.json(cached.data)
  }

  const xml = await fetchBgg(
    `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(id!)}&stats=1`,
    apiKey
  )
  if (!xml) return NextResponse.json({ error: "BGG request failed" }, { status: 502 })

  const data = parseDetail(xml)
  if (!data) return NextResponse.json(null)

  await db
    .insert(bggGameCache)
    .values({ bggId: id!, data, cachedAt: now })
    .onConflictDoUpdate({ target: bggGameCache.bggId, set: { data, cachedAt: now } })

  return NextResponse.json(data)
}
