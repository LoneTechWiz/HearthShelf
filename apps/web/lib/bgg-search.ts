import { XMLParser } from "fast-xml-parser"
import type { GameSuggestion } from "@/lib/bgg"

type BggNameNode = {
  "@_type"?: string
  "@_value"?: string
}

type BggSearchItem = {
  "@_id"?: string | number
  name?: BggNameNode | BggNameNode[]
  yearpublished?: {
    "@_value"?: string | number
  }
}

type BggThingItem = {
  "@_id"?: string | number
  image?: string
  thumbnail?: string
}

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function titleScore(query: string, suggestion: GameSuggestion) {
  const normalizedQuery = normalizeTitle(query)
  const normalizedTitle = normalizeTitle(suggestion.title)

  if (normalizedTitle === normalizedQuery) return 0
  if (normalizedTitle.startsWith(`${normalizedQuery} `)) return 1
  if (normalizedTitle.includes(normalizedQuery)) return 2
  return 3
}

export function parseBggSearchXml(xml: string): GameSuggestion[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })
  const doc = parser.parse(xml)
  const items = doc?.items?.item
  if (!items) return []
  const arr = (Array.isArray(items) ? items : [items]) as BggSearchItem[]
  return arr
    .map((item) => {
      const names = Array.isArray(item.name) ? item.name : [item.name]
      const primary = names.find((name) => name?.["@_type"] === "primary") ?? names[0]
      return {
        bggId: String(item["@_id"] ?? ""),
        title: primary?.["@_value"] ?? "",
        year: parseInt(String(item.yearpublished?.["@_value"] ?? "")) || null,
        coverUrl: null,
      }
    })
    .filter((game) => game.bggId && game.title)
}

export function parseBggCoverXml(xml: string): Map<string, string> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })
  const doc = parser.parse(xml)
  const items = doc?.items?.item
  if (!items) return new Map()

  const arr = (Array.isArray(items) ? items : [items]) as BggThingItem[]
  return new Map(
    arr
      .map((item) => {
        const id = String(item["@_id"] ?? "")
        const image = item.image ? String(item.image) : item.thumbnail ? String(item.thumbnail) : ""
        if (!id || !image) return null
        return [id, image.startsWith("http") ? image : `https:${image}`] as const
      })
      .filter((entry): entry is readonly [string, string] => entry !== null)
  )
}

export function addGameSuggestionCovers(
  suggestions: GameSuggestion[],
  covers: Map<string, string>
): GameSuggestion[] {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    coverUrl: covers.get(suggestion.bggId) ?? suggestion.coverUrl,
  }))
}

export function rankGameSuggestions(query: string, suggestions: GameSuggestion[]) {
  return [...suggestions].sort((a, b) => {
    const scoreDifference = titleScore(query, a) - titleScore(query, b)
    if (scoreDifference !== 0) return scoreDifference

    const aYear = a.year ?? Number.MAX_SAFE_INTEGER
    const bYear = b.year ?? Number.MAX_SAFE_INTEGER
    if (aYear !== bYear) return aYear - bYear

    return a.title.localeCompare(b.title)
  })
}

export function combineGameSuggestions(
  query: string,
  exactMatches: GameSuggestion[],
  broadMatches: GameSuggestion[],
  limit = 8
) {
  const seen = new Set<string>()
  const merged = [...exactMatches, ...rankGameSuggestions(query, broadMatches)]
    .filter((suggestion) => {
      if (seen.has(suggestion.bggId)) return false
      seen.add(suggestion.bggId)
      return true
    })

  return rankGameSuggestions(query, merged).slice(0, limit)
}
