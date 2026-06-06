import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getBookById } from "@/lib/queries/books"
import { DeleteBookForm } from "@/components/books/delete-book-form"

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const book = await getBookById(id, session!.user!.id!)
  if (!book) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to library
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{book.title}</h1>
            {book.authors && <p className="mt-1 text-zinc-500">{book.authors}</p>}
            {book.isbn && (
              <p className="mt-1 text-xs text-zinc-400">ISBN: {book.isbn}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/books/${book.id}/edit`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Edit
            </Link>
            <DeleteBookForm bookId={book.id} />
          </div>
        </div>

        {book.description && (
          <p className="text-sm leading-relaxed text-zinc-600">{book.description}</p>
        )}
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="mt-4 h-48 w-auto rounded-lg object-cover"
          />
        )}
      </div>
    </div>
  )
}
