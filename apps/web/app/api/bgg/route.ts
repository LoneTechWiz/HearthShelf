import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const query = searchParams.get("query")

  if (!id && !query) {
    return NextResponse.json({ error: "Missing id or query parameter" }, { status: 400 })
  }

  const bggUrl = id
    ? `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(id)}&stats=1`
    : `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query!)}&type=boardgame`

  const res = await fetch(bggUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HearthShelf/1.0; +https://github.com/LoneTechWiz/HearthShelf)",
      "Accept": "application/xml,text/xml,*/*",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`BGG upstream error: ${res.status} ${res.statusText}`, body.slice(0, 200))
    return NextResponse.json({ error: "BGG request failed", upstream: res.status }, { status: res.status })
  }

  const xml = await res.text()
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  })
}
