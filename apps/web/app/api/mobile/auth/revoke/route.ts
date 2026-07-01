import { revokeMobileToken } from "@/lib/queries/mobile-auth"

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization")
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null
  if (token) await revokeMobileToken(token)
  return Response.json({ ok: true })
}
