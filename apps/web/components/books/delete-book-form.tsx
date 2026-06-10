"use client"

import { deleteBook } from "@/lib/actions/books"
import { btnDanger } from "@/components/ui/classes"

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
      <button type="submit" className={btnDanger}>
        Delete
      </button>
    </form>
  )
}
