import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importContacts } from "@/lib/actions/contacts"

export default function ImportContactsPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Import Contacts</h1>
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
