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
        <Link href={`/books/${id}`} className="text-sm text-ink-muted hover:text-ink">
          ← Back to book
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Edit Book</h1>
      </div>
      <BookForm
        action={updateBook}
        defaultValues={book}
        submitLabel="Save Changes"
      />
    </div>
  )
}
