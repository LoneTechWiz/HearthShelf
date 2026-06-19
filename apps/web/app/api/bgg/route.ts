import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

  const bggUrl = id
    ? `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(id)}&stats=1`
    : `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query!)}&type=boardgame`

  const res = await fetch(bggUrl, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/xml,text/xml,*/*",
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
