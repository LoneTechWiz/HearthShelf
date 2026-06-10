import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { HearthGlyph, Wordmark } from "@/components/brand"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

const features = [
  {
    title: "Track your shelf",
    description: "Catalog every book you own — search by title, scan a barcode, or look up an ISBN.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: "Lend with confidence",
    description: "Check books out to friends with due dates, and always know who has what.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Import in bulk",
    description: "Bring your whole library over at once with CSV import for books and contacts.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
]

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <header className="px-6 py-5 sm:px-10">
        <Wordmark />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <HearthGlyph className="mb-6 h-14 w-14 text-accent" />
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Your home library, kept warm.
        </h1>
        <p className="mt-4 max-w-md text-ink-muted">
          Hearthshelf keeps track of every book you own and every book you&apos;ve lent —
          so your favorites always find their way home.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/dashboard" })
            }}
          >
            <button type="submit" className={`${btnPrimary} w-full gap-2 px-6 py-2.5 sm:w-auto`}>
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in with GitHub
            </button>
          </form>
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <button type="submit" className={`${btnSecondary} w-full gap-2 px-6 py-2.5 sm:w-auto`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 01-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0012 24z" />
                <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 010-4.58V6.62H1.29a12.04 12.04 0 000 10.76l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-10">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-edge bg-surface p-5 shadow-sm">
              <span className="text-accent">{feature.icon}</span>
              <h2 className="mt-3 font-display text-base font-semibold text-ink">{feature.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-edge px-6 py-6 sm:px-10">
        <Wordmark className="opacity-70" />
      </footer>
    </main>
  )
}
