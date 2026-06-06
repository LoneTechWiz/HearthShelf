import { describe, it, expect } from "vitest"
import { normalizeIsbn } from "@/lib/isbn"

describe("normalizeIsbn", () => {
  it("strips hyphens from an ISBN-13", () => {
    expect(normalizeIsbn("978-0-394-80001-1")).toBe("9780394800011")
  })

  it("strips spaces from an ISBN-13", () => {
    expect(normalizeIsbn("9780 3948 0001 1")).toBe("9780394800011")
  })

  it("accepts a plain ISBN-10", () => {
    expect(normalizeIsbn("0306406152")).toBe("0306406152")
  })

  it("accepts an ISBN-10 ending in X", () => {
    expect(normalizeIsbn("080442957X")).toBe("080442957X")
  })

  it("uppercases a trailing x in an ISBN-10", () => {
    expect(normalizeIsbn("080442957x")).toBe("080442957X")
  })

  it("returns null for too-short input", () => {
    expect(normalizeIsbn("12345")).toBeNull()
  })

  it("returns null for a 12-digit string (wrong length)", () => {
    expect(normalizeIsbn("123456789012")).toBeNull()
  })

  it("returns null for non-numeric input", () => {
    expect(normalizeIsbn("abcdefghij")).toBeNull()
  })

  it("returns null for empty input", () => {
    expect(normalizeIsbn("")).toBeNull()
  })
})
