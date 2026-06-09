import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importBooks } from "@/lib/actions/books"

export default function ImportBooksPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Import Books</h1>
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
