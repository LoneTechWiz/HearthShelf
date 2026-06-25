import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importMovies } from "@/lib/actions/movies"

export default function ImportMoviesPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/movies" className="text-sm text-ink-muted hover:text-ink">← Back to movies</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Import Movies</h1>
      </div>
      <CsvImport
        action={importMovies}
        entity="movies"
        columns={[
          { name: "title", required: true, example: "Inception" },
          { name: "director", example: "Christopher Nolan" },
          { name: "year", example: "2010" },
          { name: "format", example: "Blu-ray" },
          { name: "genre", example: "Sci-Fi" },
          { name: "runtime", example: "148" },
          { name: "description" },
          { name: "posterUrl" },
        ]}
        nextStep={{ hrefBase: "/movies/bulk-edit", label: "Review & enrich imported movies" }}
      />
    </div>
  )
}
