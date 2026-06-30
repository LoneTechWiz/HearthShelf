import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getBookById } from "@/lib/queries/books"
import { DeleteBookForm } from "@/components/books/delete-book-form"
import { ItemReviewPanel } from "@/components/reviews/item-review-panel"
import { StatusBadge } from "@/components/ui/status-badge"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"
import { getReviewForItem } from "@/lib/queries/reviews"

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const book = await getBookById(id, session!.user!.id!)
  if (!book) notFound()
  const review = book.lendableItemId
    ? await getReviewForItem(book.lendableItemId, session!.user!.id!)
    : null

  return (
    <div>
      <div className="mb-6">
        <Link href="/shelf?type=books" className="text-sm text-ink-muted hover:text-ink">
          ← Back to shelf
        </Link>
      </div>

      <div className="rounded-xl border border-edge bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{book.title}</h1>
            {book.authors && <p className="mt-1 text-ink-muted">{book.authors}</p>}
            {book.seriesName && (
              <p className="mt-1 text-sm text-ink-muted">
                {book.seriesName}
                {book.seriesPosition ? ` #${book.seriesPosition}` : ""}
                {book.seriesTotal ? ` of ${book.seriesTotal}` : ""}
              </p>
            )}
            {book.isbn && (
              <p className="mt-1 text-xs text-ink-faint">ISBN: {book.isbn}</p>
            )}
            <div className="mt-2">
              <StatusBadge status={book.isCheckedOut ? "checked-out" : "available"} />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!book.isCheckedOut && book.lendableItemId && (
              <Link
                href={`/checkouts/new?lendableItemId=${book.lendableItemId}&type=book`}
                className={btnPrimary}
              >
                Check Out
              </Link>
            )}
            <Link
              href={`/books/${book.id}/edit`}
              className={btnSecondary}
            >
              Edit
            </Link>
            <DeleteBookForm bookId={book.id} />
          </div>
        </div>

        {book.description && (
          <p className="text-sm leading-relaxed text-ink-muted">{book.description}</p>
        )}
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="mt-4 h-48 w-auto rounded-lg object-cover border border-edge"
          />
        )}
        {book.lendableItemId && (
          <ItemReviewPanel
            lendableItemId={book.lendableItemId}
            returnPath={`/books/${book.id}`}
            review={review}
          />
        )}
      </div>
    </div>
  )
}
