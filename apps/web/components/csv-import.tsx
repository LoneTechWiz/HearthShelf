"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import type { ImportResult } from "@/lib/csv/types"
import { btnPrimary, labelClass } from "@/components/ui/classes"

type ImportAction = (
  prevState: ImportResult | null,
  formData: FormData
) => Promise<ImportResult>

interface Column {
  name: string
  required?: boolean
  example?: string
}

interface CsvImportProps {
  action: ImportAction
  columns: Column[]
  entity: string
  nextStep?: { hrefBase: string; label: string }
}

export function CsvImport({ action, columns, entity, nextStep }: CsvImportProps) {
  const [state, formAction, isPending] = useActionState(action, null)
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState("")

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setText("")
      setFileName("")
      return
    }
    setFileName(file.name)
    setText(await file.text())
  }

  const header = columns.map((c) => c.name).join(",")
  const sample = columns.map((c) => c.example ?? "").join(",")
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    `${header}\n${sample}\n`
  )}`

  const succeeded = state !== null && !("error" in state)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <input type="hidden" name="csv" value={text} />

      <div className="flex flex-col gap-1">
        <label
          className={labelClass}
          htmlFor="csv-file"
        >
          CSV file
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="text-sm text-ink"
        />
        {fileName && (
          <p className="text-xs text-ink-muted">{fileName}</p>
        )}
      </div>

      <p className="text-xs text-ink-muted">
        Expected columns:{" "}
        {columns.map((c) => (
          <span key={c.name} className="font-mono">
            {c.name}
            {c.required ? "*" : ""}{" "}
          </span>
        ))}
        —{" "}
        <Link
          href={templateHref}
          download={`${entity}-template.csv`}
          className="underline hover:text-ink"
        >
          download template
        </Link>
      </p>

      <button
        type="submit"
        disabled={isPending || !text}
        className={`self-start ${btnPrimary}`}
      >
        {isPending ? "Importing…" : "Import"}
      </button>

      {state !== null && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      {succeeded && (
        <div className="rounded-md border border-edge bg-surface px-4 py-3 text-sm">
          <p className="font-medium text-ink">
            Imported {entity}: {state.created} created, {state.updated} updated,{" "}
            {state.skipped.length} skipped.
          </p>
          {state.skipped.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-ink-muted">
              {state.skipped.map((s) => (
                <li key={s.line}>
                  Line {s.line}: {s.reason}
                </li>
              ))}
            </ul>
          )}
          {nextStep && state.importedIds && state.importedIds.length > 0 && (
            <Link
              href={`${nextStep.hrefBase}?ids=${state.importedIds.join(",")}`}
              className={`mt-3 inline-block ${btnPrimary}`}
            >
              {nextStep.label}
            </Link>
          )}
        </div>
      )}
    </form>
  )
}
