import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser, getBooksByIds } from "@/lib/queries/books"
import { BookBulkEdit } from "@/components/books/book-bulk-edit"

export default async function BulkEditBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!
  const { ids } = await searchParams

  const idList = ids ? ids.split(",").filter(Boolean) : null
  const books = idList
    ? await getBooksByIds(userId, idList)
    : await getBooksForUser(userId)

  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {idList ? "Review imported books" : "Bulk edit"}
        </h1>
      </div>
      {/* Key by the scope so the editable table re-seeds when navigating between
          the imported-batch and whole-library views. */}
      <BookBulkEdit key={ids ?? "all"} books={books} />
    </div>
  )
}
