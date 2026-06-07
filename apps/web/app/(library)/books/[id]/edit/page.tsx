import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getBookById } from "@/lib/queries/books"
import { updateBook } from "@/lib/actions/books"
import { BookForm } from "@/components/books/book-form"

export default async function EditBookPage({
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
        <Link href={`/books/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to book
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Edit Book</h1>
      </div>
      <BookForm
        action={updateBook}
        defaultValues={book}
        submitLabel="Save Changes"
      />
    </div>
  )
}
