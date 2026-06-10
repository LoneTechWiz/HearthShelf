import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importBooks } from "@/lib/actions/books"

export default function ImportBooksPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-ink-muted hover:text-ink">
          ← Back to library
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Import Books</h1>
      </div>
      <CsvImport
        action={importBooks}
        entity="books"
        columns={[
          { name: "title", required: true, example: "Dune" },
          { name: "authors", example: "Frank Herbert" },
          { name: "isbn", example: "9780441013593" },
          { name: "description" },
          { name: "coverUrl" },
        ]}
        nextStep={{ hrefBase: "/books/bulk-edit", label: "Review & enrich imported books" }}
      />
    </div>
  )
}
