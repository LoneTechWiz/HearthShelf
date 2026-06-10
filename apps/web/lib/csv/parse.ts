// Splits CSV text into rows of cells. Handles "quoted, fields", "" escaped
// quotes, and CRLF/LF line endings. Fully blank lines are dropped, so reported
// line numbers count non-blank rows (header = line 1). Any characters following
// a closing quote on the same field are appended (malformed input is not rejected).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let rowHasContent = false
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += char
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      rowHasContent = true
      i++
    } else if (char === ",") {
      row.push(field)
      field = ""
      rowHasContent = true
      i++
    } else if (char === "\r") {
      // CR is only valid as part of CRLF; a lone CR is skipped.
      i++
    } else if (char === "\n") {
      if (rowHasContent) {
        row.push(field)
        rows.push(row)
      }
      row = []
      field = ""
      rowHasContent = false
      i++
    } else {
      field += char
      rowHasContent = true
      i++
    }
  }

  if (rowHasContent || field !== "") {
    row.push(field)
    rows.push(row)
  }

  return rows
}

export type CsvRecord = {
  line: number
  values: Record<string, string | null>
}

// Maps parsed rows onto expected columns using row 0 as the header. Matching is
// case-insensitive and whitespace-trimmed. Unknown columns are ignored; absent
// or empty cells become null. missingColumns lists expected columns whose header
// is absent (the caller decides which are required).
export function toRecords(
  rows: string[][],
  columns: readonly string[]
): { records: CsvRecord[]; missingColumns: string[] } {
  if (rows.length === 0) {
    return { records: [], missingColumns: [...columns] }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const indexByColumn = new Map<string, number>()
  for (const column of columns) {
    indexByColumn.set(column, header.indexOf(column.toLowerCase()))
  }
  const missingColumns = columns.filter((c) => indexByColumn.get(c) === -1)

  const records = rows.slice(1).map((cells, i) => {
    const values: Record<string, string | null> = {}
    for (const column of columns) {
      const index = indexByColumn.get(column)!
      const raw = index >= 0 ? (cells[index] ?? "").trim() : ""
      values[column] = raw === "" ? null : raw
    }
    return { line: i + 2, values } // header is line 1
  })

  return { records, missingColumns }
}
