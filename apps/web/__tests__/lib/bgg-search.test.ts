import { describe, expect, it } from "vitest"
import {
  addGameSuggestionCovers,
  combineGameSuggestions,
  parseBggCoverXml,
  parseBggSearchXml,
  rankGameSuggestions,
} from "@/lib/bgg-search"

describe("parseBggSearchXml", () => {
  it("maps BGG search XML to game suggestions", () => {
    const xml = `
      <items>
        <item type="boardgame" id="1406">
          <name type="primary" value="Monopoly"/>
          <yearpublished value="1935"/>
        </item>
      </items>
    `

    expect(parseBggSearchXml(xml)).toEqual([
      { bggId: "1406", title: "Monopoly", year: 1935, coverUrl: null },
    ])
  })
})

describe("parseBggCoverXml", () => {
  it("maps BGG thing XML ids to cover URLs", () => {
    const xml = `
      <items>
        <item type="boardgame" id="1406">
          <image>//cf.geekdo-images.com/monopoly.jpg</image>
        </item>
      </items>
    `

    expect(parseBggCoverXml(xml)).toEqual(
      new Map([["1406", "https://cf.geekdo-images.com/monopoly.jpg"]])
    )
  })

  it("uses thumbnails when full images are missing", () => {
    const xml = `
      <items>
        <item type="boardgame" id="1406">
          <thumbnail>//cf.geekdo-images.com/monopoly-thumb.jpg</thumbnail>
        </item>
      </items>
    `

    expect(parseBggCoverXml(xml)).toEqual(
      new Map([["1406", "https://cf.geekdo-images.com/monopoly-thumb.jpg"]])
    )
  })
})

describe("rankGameSuggestions", () => {
  it("puts exact title matches before variations", () => {
    const results = rankGameSuggestions("monopoly", [
      { bggId: "2", title: "Monopoly: Star Wars", year: 1997 },
      { bggId: "1", title: "Monopoly", year: 1935 },
      { bggId: "3", title: "Anti-Monopoly", year: 1973 },
    ].map((suggestion) => ({ ...suggestion, coverUrl: null })))

    expect(results.map((result) => result.bggId)).toEqual(["1", "2", "3"])
  })

  it("uses older years first for exact title ties", () => {
    const results = rankGameSuggestions("monopoly", [
      { bggId: "new", title: "Monopoly", year: 2025 },
      { bggId: "original", title: "Monopoly", year: 1935 },
    ].map((suggestion) => ({ ...suggestion, coverUrl: null })))

    expect(results.map((result) => result.bggId)).toEqual(["original", "new"])
  })
})

describe("combineGameSuggestions", () => {
  it("keeps exact matches available even when broad results are noisy", () => {
    const results = combineGameSuggestions(
      "monopoly",
      [{ bggId: "original", title: "Monopoly", year: 1935, coverUrl: null }],
      [
        { bggId: "variant-1", title: "Monopoly Deal", year: 2008, coverUrl: null },
        { bggId: "variant-2", title: "Monopoly: Star Wars", year: 1997, coverUrl: null },
        { bggId: "original", title: "Monopoly", year: 1935, coverUrl: null },
      ]
    )

    expect(results.map((result) => result.bggId)).toEqual([
      "original",
      "variant-2",
      "variant-1",
    ])
  })
})

describe("addGameSuggestionCovers", () => {
  it("adds cover URLs to matching suggestions", () => {
    const results = addGameSuggestionCovers(
      [{ bggId: "1406", title: "Monopoly", year: 1935, coverUrl: null }],
      new Map([["1406", "https://example.com/monopoly.jpg"]])
    )

    expect(results).toEqual([
      {
        bggId: "1406",
        title: "Monopoly",
        year: 1935,
        coverUrl: "https://example.com/monopoly.jpg",
      },
    ])
  })
})
