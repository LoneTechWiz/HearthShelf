import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importContacts } from "@/lib/actions/contacts"

export default function ImportContactsPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-ink-muted hover:text-ink">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Import Contacts</h1>
      </div>
      <CsvImport
        action={importContacts}
        entity="contacts"
        columns={[
          { name: "name", required: true, example: "Alice Reader" },
          { name: "email", example: "alice@example.com" },
          { name: "phone", example: "555-1234" },
        ]}
      />
    </div>
  )
}
