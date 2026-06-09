import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { BooksList } from "@/components/books/books-list"

export default async function BooksPage() {
  const session = await auth()
  const books = await getBooksForUser(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">My Library</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/books/bulk-edit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Bulk edit
          </Link>
          <Link
            href="/books/import"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Import CSV
          </Link>
          <Link
            href="/books/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Book
          </Link>
        </div>
      </div>
      <BooksList books={books} />
    </div>
  )
}
