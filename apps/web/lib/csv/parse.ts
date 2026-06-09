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
