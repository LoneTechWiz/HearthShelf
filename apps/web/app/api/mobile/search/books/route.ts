import { lookupByIsbn, searchByTitle } from "@/lib/open-library"
import { jsonError, nullIfEmpty, requireMobileUser } from "@/app/api/mobile/_utils"

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const { searchParams } = new URL(request.url)
  const isbn = nullIfEmpty(searchParams.get("isbn"))
  if (isbn) {
    const suggestion = await lookupByIsbn(isbn)
    return Response.json({ suggestion })
  }

  const title = nullIfEmpty(searchParams.get("title"))
  if (title) {
    const suggestions = await searchByTitle(title)
    return Response.json({ suggestions })
  }

  return jsonError("ISBN or title is required")
}
