import Link from "next/link"
import { auth } from "@/auth"
import { createEvent } from "@/lib/actions/events"
import { ensureLendableItemsForUser } from "@/lib/queries/checkouts"
import { getBooksForUser } from "@/lib/queries/books"
import { getGamesForUser } from "@/lib/queries/games"
import { getMoviesForUser } from "@/lib/queries/movies"
import { EventForm } from "@/components/events/event-form"

export default async function NewEventPage() {
  const session = await auth()
  const userId = session!.user!.id!

  await ensureLendableItemsForUser(userId)

  const [books, movies, games] = await Promise.all([
    getBooksForUser(userId),
    getMoviesForUser(userId),
    getGamesForUser(userId),
  ])

  return (
    <div>
      <div className="mb-6">
        <Link href="/events" className="text-sm text-ink-muted hover:text-ink">← Back to events</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Create Event</h1>
      </div>

      <EventForm
        action={createEvent}
        books={books
          .filter((book) => book.lendableItemId)
          .map((book) => ({
            lendableItemId: book.lendableItemId!,
            title: book.title,
            subtitle: book.authors,
          }))}
        movies={movies
          .filter((movie) => movie.lendableItemId)
          .map((movie) => ({
            lendableItemId: movie.lendableItemId!,
            title: movie.title,
            subtitle: movie.director,
          }))}
        games={games
          .filter((game) => game.lendableItemId)
          .map((game) => ({
            lendableItemId: game.lendableItemId!,
            title: game.title,
            subtitle: game.minPlayers && game.maxPlayers ? `${game.minPlayers}-${game.maxPlayers} players` : null,
          }))}
      />
    </div>
  )
}
