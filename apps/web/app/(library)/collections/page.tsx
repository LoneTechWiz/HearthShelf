import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { buildAuthorCollections, buildSeriesCollections } from "@/lib/book-collections"
import { BookCollections } from "@/components/books/book-collections"
import { PageHeader } from "@/components/ui/page-header"
import { btnSecondary } from "@/components/ui/classes"

export default async function CollectionsPage() {
  const session = await auth()
  const books = await getBooksForUser(session!.user!.id!)
  const authorCollections = buildAuthorCollections(books)
  const seriesCollections = buildSeriesCollections(books)

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle="Browse your books by series or author."
        actions={<Link href="/books/bulk-edit" className={btnSecondary}>Edit book metadata</Link>}
      />
      <BookCollections
        authorCollections={authorCollections}
        seriesCollections={seriesCollections}
      />
    </div>
  )
}
