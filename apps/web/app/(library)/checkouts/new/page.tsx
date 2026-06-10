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
        <Link href="/checkouts" className="text-sm text-ink-muted hover:text-ink">
          ← Back to checkouts
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Check Out a Book</h1>
      </div>

      {availableBooks.length === 0 ? (
        <p className="text-ink-muted">
          All books are currently checked out.{" "}
          <Link href="/books" className="text-ink underline">
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
