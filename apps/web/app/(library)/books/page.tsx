import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"

export default async function BooksPage() {
  const session = await auth()
  const books = await getBooksForUser(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">My Library</h1>
        <Link
          href="/books/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Add Book
        </Link>
      </div>

      {books.length === 0 ? (
        <p className="text-zinc-500">No books yet. Add your first book to get started.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                href={`/books/${book.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50"
              >
                <div className="flex items-center gap-4">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="h-14 w-10 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-10 flex-shrink-0 rounded bg-zinc-100" />
                  )}
                  <div>
                    <p className="font-medium text-zinc-900">{book.title}</p>
                    {book.authors && (
                      <p className="text-sm text-zinc-500">{book.authors}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    book.isCheckedOut
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {book.isCheckedOut ? "Checked out" : "Available"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
