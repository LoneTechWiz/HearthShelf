// Splits CSV text into rows of cells. Handles "quoted, fields", "" escaped
// quotes, and CRLF/LF line endings. Fully blank lines are dropped, so reported
// line numbers count non-blank rows (header = line 1).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
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
      i++
    } else if (char === ",") {
      row.push(field)
      field = ""
      i++
    } else if (char === "\r") {
      i++
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i++
    } else {
      field += char
      i++
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""))
}
