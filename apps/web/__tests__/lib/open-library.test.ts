import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"

describe("searchByTitle", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns mapped suggestions from API response", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            {
              key: "/works/OL12345W",
              title: "Dune",
              author_name: ["Frank Herbert"],
              isbn: ["9780441013593"],
              cover_i: 8839523,
              series_key: ["OL1L"],
              series_name: ["Dune"],
              series_position: ["1"],
              subject: ["Dune (Imaginary place)", "Fiction", "Science fiction"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            { series_name: ["Dune"], series_position: ["1"] },
            { series_name: ["Dune"], series_position: ["2"] },
            { series_name: ["Dune"], series_position: ["1-2"] },
          ],
        }),
      })
    )
    const results = await searchByTitle("Dune")
    expect(results).toEqual([{
      key: "/works/OL12345W",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      seriesKey: "OL1L",
      seriesName: "Dune",
      seriesPosition: 1,
      seriesTotal: 2,
      genre: "Science fiction",
      coverUrl: "https://covers.openlibrary.org/b/id/8839523-S.jpg",
      description: null,
    }])
  })

  it("sets isbn to null when missing from doc", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [{ key: "/works/OL99W", title: "No ISBN Book", author_name: ["Author"] }],
      }),
    }))
    const results = await searchByTitle("No ISBN")
    expect(results).toEqual([{
      key: "/works/OL99W",
      title: "No ISBN Book",
      authors: "Author",
      isbn: null,
      seriesKey: null,
      seriesName: null,
      seriesPosition: null,
      seriesTotal: null,
      genre: null,
      coverUrl: null,
      description: null,
    }])
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(searchByTitle("Dune")).rejects.toThrow("Search failed")
  })

  it("returns empty array when docs is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const results = await searchByTitle("nonexistent")
    expect(results).toEqual([])
  })
})

describe("lookupByIsbn", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns book details including description from work record", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          "ISBN:9780441013593": {
            details: {
              title: "Dune",
              authors: [{ name: "Frank Herbert" }],
              covers: [8839523],
              works: [{ key: "/works/OL12345W" }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          description: "A science fiction novel.",
          subjects: ["Dune (Imaginary place)", "Fiction", "Science fiction"],
        }),
      })
    )
    const result = await lookupByIsbn("9780441013593")
    expect(result).toEqual({
      key: "9780441013593",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      seriesKey: null,
      seriesName: null,
      seriesPosition: null,
      seriesTotal: null,
      genre: "Science fiction",
      coverUrl: "https://covers.openlibrary.org/b/id/8839523-M.jpg",
      description: "A science fiction novel.",
    })
  })

  it("returns book series details from the work record", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          "ISBN:9780590353427": {
            details: {
              title: "Harry Potter and the Sorcerer's Stone",
              authors: [{ name: "J.K. Rowling" }],
              works: [{ key: "/works/OL82563W" }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          series: [{ series: { key: "/series/OL326110L" }, position: "1" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            { series_name: ["Harry Potter"], series_position: ["1"] },
            { series_name: ["Harry Potter"], series_position: ["7"] },
            { series_name: ["Harry Potter"], series_position: ["1-7"] },
          ],
        }),
      })
    )
    const result = await lookupByIsbn("9780590353427")
    expect(result).toMatchObject({
      seriesKey: "OL326110L",
      seriesName: "Harry Potter",
      seriesPosition: 1,
      seriesTotal: 7,
    })
  })

  it("handles work description as object with value property", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          "ISBN:9780441013593": {
            details: {
              title: "Dune",
              authors: [],
              works: [{ key: "/works/OL12345W" }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ description: { value: "A science fiction novel." } }),
      })
    )
    const result = await lookupByIsbn("9780441013593")
    expect(result?.description).toBe("A science fiction novel.")
  })

  it("returns null description when no work key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "ISBN:9780441013593": {
          details: { title: "Dune", authors: [] },
        },
      }),
    }))
    const result = await lookupByIsbn("9780441013593")
    expect(result?.description).toBeNull()
  })

  it("uses edition subjects when no work genre is available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "ISBN:9780441013593": {
          details: {
            title: "Dune",
            authors: [],
            subjects: [{ name: "Science fiction" }],
          },
        },
      }),
    }))
    const result = await lookupByIsbn("9780441013593")
    expect(result?.genre).toBe("Science fiction")
  })

  it("returns null when ISBN is not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const result = await lookupByIsbn("0000000000")
    expect(result).toBeNull()
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(lookupByIsbn("9780441013593")).rejects.toThrow("Lookup failed")
  })
})
