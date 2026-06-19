"use client"

export type GameSuggestion = {
  bggId: string
  title: string
  year: number | null
}

export type GameDetail = {
  title: string
  coverUrl: string | null
  minPlayers: number | null
  maxPlayers: number | null
  ageRating: string | null
  genre: string | null
  description: string | null
}

export async function searchGamesByTitle(title: string): Promise<GameSuggestion[]> {
  const res = await fetch(
    `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(title)}&type=boardgame`
  )
  if (!res.ok) throw new Error("Search failed")
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, "text/xml")
  const items = Array.from(doc.querySelectorAll("item"))
  return items
    .map((item) => ({
      bggId: item.getAttribute("id") ?? "",
      title:
        item.querySelector("name[type='primary']")?.getAttribute("value") ??
        item.querySelector("name")?.getAttribute("value") ??
        "",
      year:
        parseInt(item.querySelector("yearpublished")?.getAttribute("value") ?? "") || null,
    }))
    .filter((g) => g.title !== "")
    .slice(0, 8)
}

export async function getGameByBggId(bggId: string): Promise<GameDetail | null> {
  const res = await fetch(
    `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(bggId)}&stats=1`
  )
  if (!res.ok) throw new Error("Lookup failed")
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, "text/xml")
  const item = doc.querySelector("item")
  if (!item) return null

  const getVal = (sel: string) => item.querySelector(sel)?.getAttribute("value") ?? null

  const rawCover = item.querySelector("image")?.textContent?.trim() ?? null
  const coverUrl = rawCover
    ? rawCover.startsWith("http")
      ? rawCover
      : `https:${rawCover}`
    : null

  // BGG description is HTML-escaped; strip tags via a throwaway DOMParser parse
  const rawDesc = item.querySelector("description")?.textContent ?? null
  const description = rawDesc
    ? new DOMParser().parseFromString(rawDesc, "text/html").body.textContent?.trim() || null
    : null

  const minAge = parseInt(getVal("minage") ?? "") || null

  return {
    title: getVal("name[type='primary']") ?? "",
    coverUrl,
    minPlayers: parseInt(getVal("minplayers") ?? "") || null,
    maxPlayers: parseInt(getVal("maxplayers") ?? "") || null,
    ageRating: minAge ? `${minAge}+` : null,
    genre: item.querySelector("link[type='boardgamecategory']")?.getAttribute("value") ?? null,
    description,
  }
}
