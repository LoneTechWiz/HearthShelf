import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import { Linking } from "react-native"
import type { MobileUser } from "@my-shelf/types"
import { API_BASE_URL, exchangeAuthCode, getMe, revokeSession } from "./api"
import { setMobileToken } from "./token-store"

const REDIRECT_URI = "hearthshelf://auth/callback"

type AuthContextValue = {
  user: MobileUser | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  openSignIn: () => Promise<void>
  signOutLocal: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<MobileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setError(null)
    try {
      const result = await getMe()
      setUser(result.user)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : "Unable to check session")
    } finally {
      setLoading(false)
    }
  }

  async function openSignIn() {
    await Linking.openURL(
      `${API_BASE_URL}/api/mobile/auth/start?redirectUri=${encodeURIComponent(REDIRECT_URI)}`
    )
  }

  async function signOutLocal() {
    await revokeSession().catch(() => null)
    await setMobileToken(null)
    setUser(null)
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) return
      const parsed = new URL(url)
      if (parsed.protocol !== "hearthshelf:" || parsed.hostname !== "auth") return
      const code = parsed.searchParams.get("code")
      if (!code) return
      try {
        const result = await exchangeAuthCode(code, REDIRECT_URI)
        await setMobileToken(result.token)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to complete sign in")
      }
    }

    void Linking.getInitialURL().then(handleUrl)
    const subscription = Linking.addEventListener("url", (event) => {
      void handleUrl(event.url)
    })
    return () => subscription.remove()
  }, [])

  const value = useMemo(
    () => ({ user, loading, error, refresh, openSignIn, signOutLocal }),
    [user, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
