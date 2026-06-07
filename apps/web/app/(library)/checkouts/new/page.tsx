import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { getContactsForUser } from "@/lib/queries/contacts"
import { createCheckout } from "@/lib/actions/checkouts"
import { CheckoutForm } from "@/components/checkouts/checkout-form"

export default async function NewCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>
}) {
  const { bookId } = await searchParams
  const session = await auth()
  const userId = session!.user!.id!

  const [books, contacts] = await Promise.all([
    getBooksForUser(userId),
    getContactsForUser(userId),
  ])

  const availableBooks = books.filter((b) => !b.isCheckedOut)

  return (
    <div>
      <div className="mb-6">
        <Link href="/checkouts" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to checkouts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Check Out a Book</h1>
      </div>

      {availableBooks.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          All books are currently checked out.{" "}
          <Link href="/books" className="text-zinc-900 underline dark:text-zinc-100">
            Return one first.
          </Link>
        </p>
      ) : (
        <CheckoutForm
          action={createCheckout}
          books={availableBooks}
          contacts={contacts}
          defaultBookId={bookId}
        />
      )}
    </div>
  )
}
