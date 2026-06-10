import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { BooksList } from "@/components/books/books-list"
import { PageHeader } from "@/components/ui/page-header"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

export default async function BooksPage() {
  const session = await auth()
  const books = await getBooksForUser(session!.user!.id!)

  return (
    <div>
      <PageHeader
        title="My Library"
        subtitle={`${books.length} ${books.length === 1 ? "book" : "books"}`}
        actions={
          <>
            <Link href="/books/bulk-edit" className={btnSecondary}>Bulk edit</Link>
            <Link href="/books/import" className={btnSecondary}>Import CSV</Link>
            <Link href="/books/new" className={btnPrimary}>Add Book</Link>
          </>
        }
      />
      <BooksList books={books} />
    </div>
  )
}
