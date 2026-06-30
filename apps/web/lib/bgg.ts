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
  const res = await fetch(`/api/bgg?query=${encodeURIComponent(title)}`)
  if (!res.ok) throw new Error("Search failed")
  return res.json()
}

export async function getGameByBggId(bggId: string): Promise<GameDetail | null> {
  const res = await fetch(`/api/bgg?id=${encodeURIComponent(bggId)}`)
  if (!res.ok) throw new Error("Lookup failed")
  return res.json()
}
