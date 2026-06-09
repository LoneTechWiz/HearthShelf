import { describe, it, expect } from "vitest"
import { parseCsv } from "@/lib/csv/parse"

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
})
