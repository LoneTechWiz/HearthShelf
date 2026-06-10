"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import type { ImportResult } from "@/lib/csv/types"

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
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          htmlFor="csv-file"
        >
          CSV file
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="text-sm text-zinc-700 dark:text-zinc-300"
        />
        {fileName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{fileName}</p>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
          className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          download template
        </Link>
      </p>

      <button
        type="submit"
        disabled={isPending || !text}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Importing…" : "Import"}
      </button>

      {state !== null && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      {succeeded && (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Imported {entity}: {state.created} created, {state.updated} updated,{" "}
            {state.skipped.length} skipped.
          </p>
          {state.skipped.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-zinc-600 dark:text-zinc-400">
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
              className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {nextStep.label}
            </Link>
          )}
        </div>
      )}
    </form>
  )
}
