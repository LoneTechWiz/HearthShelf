import { auth } from "@/auth"
import { createMobileAuthCode } from "@/lib/queries/mobile-auth"

const ALLOWED_SCHEMES = new Set(["hearthshelf:"])

function safeRedirectUri(value: string | null): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return ALLOWED_SCHEMES.has(url.protocol) ? url : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const session = await auth()
  const requestUrl = new URL(request.url)
  const redirectUri = safeRedirectUri(requestUrl.searchParams.get("redirectUri"))

  if (!redirectUri) {
    return Response.json({ error: "Invalid redirect URI" }, { status: 400 })
  }

  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`${requestUrl.pathname}${requestUrl.search}`)
    return Response.redirect(new URL(`/mobile-sign-in?callbackUrl=${callbackUrl}`, request.url))
  }

  const code = await createMobileAuthCode(session.user.id, redirectUri.toString())
  redirectUri.searchParams.set("code", code)
  return Response.redirect(redirectUri)
}
