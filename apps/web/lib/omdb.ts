export type MovieSuggestion = {
  imdbId: string
  title: string
  year: string
  posterUrl: string | null
}

export type MovieDetail = {
  title: string
  director: string | null
  year: number | null
  posterUrl: string | null
  genre: string | null
  runtime: number | null
  description: string | null
}

export async function searchMoviesByTitle(title: string): Promise<MovieSuggestion[]> {
  const res = await fetch(`/api/omdb?s=${encodeURIComponent(title)}`)
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  if (data.Response === "False" || !data.Search) return []
  return (data.Search as Array<{
    imdbID: string
    Title: string
    Year: string
    Poster: string
  }>).map((item) => ({
    imdbId: item.imdbID,
    title: item.Title,
    year: item.Year,
    posterUrl: item.Poster !== "N/A" ? item.Poster : null,
  }))
}

export async function getMovieByImdbId(imdbId: string): Promise<MovieDetail | null> {
  const res = await fetch(`/api/omdb?i=${encodeURIComponent(imdbId)}`)
  if (!res.ok) throw new Error("Lookup failed")
  const data = await res.json()
  if (data.Response === "False") return null

  const runtimeMatch = (data.Runtime as string | undefined)?.match(/^(\d+)/)
  const runtime = runtimeMatch ? parseInt(runtimeMatch[1], 10) : null

  return {
    title: data.Title ?? "",
    director: data.Director !== "N/A" ? (data.Director ?? null) : null,
    year: data.Year ? parseInt(String(data.Year), 10) : null,
    posterUrl: data.Poster !== "N/A" ? (data.Poster ?? null) : null,
    genre: data.Genre !== "N/A" ? (data.Genre ?? null) : null,
    runtime,
    description: data.Plot !== "N/A" ? (data.Plot ?? null) : null,
  }
}
