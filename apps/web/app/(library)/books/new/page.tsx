import Link from "next/link"
import { BookForm } from "@/components/books/book-form"
import { createBook } from "@/lib/actions/books"

export default function NewBookPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Add a Book</h1>
      </div>
      <BookForm action={createBook} submitLabel="Add Book" />
    </div>
  )
}
