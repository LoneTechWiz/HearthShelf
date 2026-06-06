"use client"

import { deleteBook } from "@/lib/actions/books"

interface DeleteBookFormProps {
  bookId: string
}

export function DeleteBookForm({ bookId }: DeleteBookFormProps) {
  const handleDelete = async (formData: FormData) => {
    if (!confirm("Delete this book? This cannot be undone.")) {
      return
    }
    await deleteBook(null, formData)
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="id" value={bookId} />
      <button
        type="submit"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
      >
        Delete
      </button>
    </form>
  )
}
