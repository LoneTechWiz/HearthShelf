import { exchangeMobileAuthCode } from "@/lib/queries/mobile-auth"
import { jsonError, nullIfEmpty } from "@/app/api/mobile/_utils"

export async function POST(request: Request) {
  const body = await request.json()
  const code = nullIfEmpty(body.code)
  const redirectUri = nullIfEmpty(body.redirectUri)
  if (!code || !redirectUri) return jsonError("Code and redirect URI are required")

  const session = await exchangeMobileAuthCode(code, redirectUri)
  if (!session) return jsonError("Invalid or expired code", 401)

  return Response.json({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
  })
}
