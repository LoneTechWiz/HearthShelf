import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { getMoviesForUser } from "@/lib/queries/movies"
import { getGamesForUser } from "@/lib/queries/games"
import { getContactsForUser } from "@/lib/queries/contacts"
import { createCheckout } from "@/lib/actions/checkouts"
import { CheckoutForm } from "@/components/checkouts/checkout-form"

export default async function NewCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ lendableItemId?: string; type?: string }>
}) {
  const { lendableItemId, type } = await searchParams
  const session = await auth()
  const userId = session!.user!.id!

  const [books, movies, games, contacts] = await Promise.all([
    getBooksForUser(userId),
    getMoviesForUser(userId),
    getGamesForUser(userId),
    getContactsForUser(userId),
  ])

  const availableBooks = books
    .filter((b) => !b.isCheckedOut && b.lendableItemId)
    .map((b) => ({ lendableItemId: b.lendableItemId!, title: b.title, subtitle: b.authors }))

  const availableMovies = movies
    .filter((m) => !m.isCheckedOut && m.lendableItemId)
    .map((m) => ({ lendableItemId: m.lendableItemId!, title: m.title, subtitle: m.director }))

  const availableGames = games
    .filter((g) => !g.isCheckedOut && g.lendableItemId)
    .map((g) => ({
      lendableItemId: g.lendableItemId!,
      title: g.title,
      subtitle: g.minPlayers && g.maxPlayers ? `${g.minPlayers}–${g.maxPlayers} players` : null,
    }))

  const totalAvailable = availableBooks.length + availableMovies.length + availableGames.length
  const defaultType = (["book", "movie", "game"] as const).includes(type as "book") ? (type as "book" | "movie" | "game") : "book"

  return (
    <div>
      <div className="mb-6">
        <Link href="/checkouts" className="text-sm text-ink-muted hover:text-ink">← Back to checkouts</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Check Out an Item</h1>
      </div>

      {totalAvailable === 0 ? (
        <p className="text-ink-muted">
          All items are currently checked out.{" "}
          <Link href="/checkouts" className="text-ink underline">Return one first.</Link>
        </p>
      ) : (
        <CheckoutForm
          action={createCheckout}
          books={availableBooks}
          movies={availableMovies}
          games={availableGames}
          contacts={contacts}
          defaultLendableItemId={lendableItemId}
          defaultType={defaultType}
        />
      )}
    </div>
  )
}
