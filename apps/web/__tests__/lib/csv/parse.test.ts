import { describe, it, expect } from "vitest"
import { parseCsv } from "@/lib/csv/parse"
import { toRecords } from "@/lib/csv/parse"

describe("parseCsv", () => {
  it("parses a simple header + row", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("keeps commas inside quoted fields", () => {
    expect(parseCsv('title\n"Dune, part 1"')).toEqual([
      ["title"],
      ["Dune, part 1"],
    ])
  })

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsv('a\n"She said ""hi"""')).toEqual([
      ["a"],
      ['She said "hi"'],
    ])
  })

  it("handles CRLF line endings and a trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("skips fully blank lines", () => {
    expect(parseCsv("a\n\n1\n")).toEqual([["a"], ["1"]])
  })

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([])
  })

  it("preserves a quoted whitespace-only field", () => {
    expect(parseCsv('title\n" "')).toEqual([["title"], [" "]])
  })

  it("preserves an explicit empty quoted field", () => {
    expect(parseCsv('a\n""')).toEqual([["a"], [""]])
  })

  it("appends characters after a closing quote (malformed input)", () => {
    expect(parseCsv('a\n"hi"there')).toEqual([["a"], ["hithere"]])
  })
})

describe("toRecords", () => {
  it("maps cells onto expected columns case-insensitively", () => {
    const rows = [
      ["Title", "ISBN"],
      ["Dune", "123"],
    ]
    const { records, missingColumns } = toRecords(rows, ["title", "isbn", "authors"])
    expect(missingColumns).toEqual(["authors"])
    expect(records).toEqual([
      { line: 2, values: { title: "Dune", isbn: "123", authors: null } },
    ])
  })

  it("turns empty cells into null and trims values", () => {
    const rows = [
      ["title", "isbn"],
      [" Dune ", ""],
    ]
    const { records } = toRecords(rows, ["title", "isbn"])
    expect(records[0].values).toEqual({ title: "Dune", isbn: null })
  })

  it("reports a missing required header in missingColumns", () => {
    const rows = [["isbn"], ["123"]]
    const { missingColumns } = toRecords(rows, ["title", "isbn"])
    expect(missingColumns).toContain("title")
  })

  it("returns no records and all columns missing for empty rows", () => {
    const { records, missingColumns } = toRecords([], ["title"])
    expect(records).toEqual([])
    expect(missingColumns).toEqual(["title"])
  })
})
