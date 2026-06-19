import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const apiKey = process.env.OMDB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OMDB_API_KEY not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const params = new URLSearchParams(searchParams)
  params.set("apikey", apiKey)

  const res = await fetch(`https://www.omdbapi.com/?${params}`)
  const data = await res.json()
  return NextResponse.json(data)
}
