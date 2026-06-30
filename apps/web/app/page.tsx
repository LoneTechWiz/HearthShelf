import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { HearthGlyph, Wordmark } from "@/components/brand"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

const shelfItems = [
  { label: "Books", value: "128", detail: "18 series tracked" },
  { label: "Movies", value: "42", detail: "9 collections" },
  { label: "Games", value: "31", detail: "Ready to lend or play" },
]

const featureCards = [
  {
    title: "One shelf for everything",
    description: "Books, movies, and games live together in one cozy library, with quick filters when you want a specific shelf.",
  },
  {
    title: "Collections that make sense",
    description: "Group books by author or series, browse movie series, and see how close you are to finishing a set.",
  },
  {
    title: "Lending without guesswork",
    description: "Check items out to contacts, add due dates, and keep track of what is home and what is visiting a friend.",
  },
  {
    title: "Personal reviews and ratings",
    description: "Leave your own star rating and review on any item so future-you remembers what was worth revisiting.",
  },
]

const activity = [
  "The Fellowship of the Ring returned home",
  "Monopoly added to the games shelf",
  "Star Wars collection updated",
]

function SignInButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form
        action={async () => {
          "use server"
          await signIn("google", { redirectTo: "/dashboard" })
        }}
      >
        <button type="submit" className={`${btnPrimary} w-full gap-2 px-6 py-2.5 sm:w-auto`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 01-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0012 24z" />
            <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 010-4.58V6.62H1.29a12.04 12.04 0 000 10.76l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
          </svg>
          Sign in with Google
        </button>
      </form>
      <form
        action={async () => {
          "use server"
          await signIn("github", { redirectTo: "/dashboard" })
        }}
      >
        <button type="submit" className={`${btnSecondary} w-full gap-2 px-6 py-2.5 sm:w-auto`}>
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Sign in with GitHub
        </button>
      </form>
    </div>
  )
}

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Wordmark />
        <span className="hidden rounded-full border border-edge bg-surface px-3 py-1 text-sm text-ink-muted shadow-sm sm:inline-flex">
          Your household shelf, remembered
        </span>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1 text-sm text-ink-muted shadow-sm">
            <HearthGlyph className="h-4 w-4 text-accent" />
            Books, movies, games, and the stories around them
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Make your shelf feel like home.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
            HearthShelf keeps every favorite in one warm place: the books you collect, the movies you revisit,
            the games you lend out, and the reviews that capture what you thought.
          </p>
          <div className="mt-8">
            <SignInButtons />
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <div className="rounded-xl bg-accent-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-accent">Shelf snapshot</p>
                <h2 className="font-display text-2xl font-semibold text-ink">Everything has a place</h2>
              </div>
              <HearthGlyph className="h-9 w-9 text-accent" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {shelfItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-edge bg-surface p-3">
                  <p className="text-xs uppercase tracking-wide text-ink-faint">{item.label}</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-ink">{item.value}</p>
                  <p className="mt-1 text-xs text-ink-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-edge bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Dune</p>
                  <p className="text-xs text-ink-muted">Book 1 of 6 in series</p>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-xs text-accent">Reviewed</span>
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Ticket to Ride</p>
                  <p className="text-xs text-ink-muted">Checked out to Sam, due Friday</p>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-xs text-ink-muted">Away</span>
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-surface-raised p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Recent warmth</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {activity.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-accent">Built for the full shelf</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Not just a catalog. A memory of what you love and where it went.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-edge bg-canvas p-5">
                <h3 className="font-display text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl border border-edge bg-surface p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Ready to bring the shelf home?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
              Sign in, add the first thing you love, and let HearthShelf remember the rest.
            </p>
          </div>
          <p className="rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
            Start with one favorite.
          </p>
        </div>
      </section>

      <footer className="border-t border-edge px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Wordmark className="opacity-80" />
          <p className="text-sm text-ink-muted">Keep favorites close, even when they wander.</p>
        </div>
      </footer>
    </main>
  )
}
