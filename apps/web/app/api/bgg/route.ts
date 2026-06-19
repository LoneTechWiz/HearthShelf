import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
    headers: { "User-Agent": "HearthShelf/1.0" },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "BGG request failed" }, { status: res.status })
  }

  const xml = await res.text()
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  })
}
