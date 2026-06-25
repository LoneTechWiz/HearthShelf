import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importGames } from "@/lib/actions/games"

export default function ImportGamesPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/games" className="text-sm text-ink-muted hover:text-ink">← Back to games</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Import Games</h1>
      </div>
      <CsvImport
        action={importGames}
        entity="games"
        columns={[
          { name: "title", required: true, example: "Catan" },
          { name: "minPlayers", example: "3" },
          { name: "maxPlayers", example: "4" },
          { name: "ageRating", example: "10+" },
          { name: "genre", example: "Strategy" },
          { name: "description" },
          { name: "coverUrl" },
        ]}
        nextStep={{ hrefBase: "/games/bulk-edit", label: "Review & enrich imported games" }}
      />
    </div>
  )
}
