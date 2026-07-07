import { auth, signIn } from "@/auth"
import { HearthGlyph, Wordmark } from "@/components/brand"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"
import { redirect } from "next/navigation"

const ALLOWED_SCHEMES = new Set(["hearthshelf:"])

function getMobileCallback(value: string | undefined): string {
  if (!value?.startsWith("/api/mobile/auth/start?")) return "/"

  const callbackUrl = new URL(value, "https://hearthshelf.local")
  const redirectUri = callbackUrl.searchParams.get("redirectUri")
  if (!redirectUri) return "/"

  try {
    const parsedRedirect = new URL(redirectUri)
    if (!ALLOWED_SCHEMES.has(parsedRedirect.protocol)) return "/"
  } catch {
    return "/"
  }

  return `${callbackUrl.pathname}${callbackUrl.search}`
}

export default async function MobileSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  const { callbackUrl: rawCallbackUrl } = await searchParams
  const callbackUrl = getMobileCallback(rawCallbackUrl)

  if (session?.user?.id) redirect(callbackUrl)

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8">
          <Wordmark />
        </div>

        <section className="rounded-xl border border-edge bg-surface p-6 shadow-sm">
          <div className="mb-6 inline-flex rounded-xl bg-accent-soft p-3 text-accent">
            <HearthGlyph className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium uppercase text-accent">Mobile sign in</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Continue to HearthShelf
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Sign in with the same account you use on the web, then return to the mobile app.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <form
              action={async () => {
                "use server"
                await signIn("google", { redirectTo: callbackUrl })
              }}
            >
              <button type="submit" className={`${btnPrimary} w-full gap-2 px-6 py-2.5`}>
                Sign in with Google
              </button>
            </form>
            <form
              action={async () => {
                "use server"
                await signIn("github", { redirectTo: callbackUrl })
              }}
            >
              <button type="submit" className={`${btnSecondary} w-full gap-2 px-6 py-2.5`}>
                Sign in with GitHub
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
