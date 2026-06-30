import { describe, expect, it } from "vitest"
import { combineGameSuggestions, parseBggSearchXml, rankGameSuggestions } from "@/lib/bgg-search"

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
      { bggId: "1406", title: "Monopoly", year: 1935 },
    ])
  })
})

describe("rankGameSuggestions", () => {
  it("puts exact title matches before variations", () => {
    const results = rankGameSuggestions("monopoly", [
      { bggId: "2", title: "Monopoly: Star Wars", year: 1997 },
      { bggId: "1", title: "Monopoly", year: 1935 },
      { bggId: "3", title: "Anti-Monopoly", year: 1973 },
    ])

    expect(results.map((result) => result.bggId)).toEqual(["1", "2", "3"])
  })

  it("uses older years first for exact title ties", () => {
    const results = rankGameSuggestions("monopoly", [
      { bggId: "new", title: "Monopoly", year: 2025 },
      { bggId: "original", title: "Monopoly", year: 1935 },
    ])

    expect(results.map((result) => result.bggId)).toEqual(["original", "new"])
  })
})

describe("combineGameSuggestions", () => {
  it("keeps exact matches available even when broad results are noisy", () => {
    const results = combineGameSuggestions(
      "monopoly",
      [{ bggId: "original", title: "Monopoly", year: 1935 }],
      [
        { bggId: "variant-1", title: "Monopoly Deal", year: 2008 },
        { bggId: "variant-2", title: "Monopoly: Star Wars", year: 1997 },
        { bggId: "original", title: "Monopoly", year: 1935 },
      ]
    )

    expect(results.map((result) => result.bggId)).toEqual([
      "original",
      "variant-2",
      "variant-1",
    ])
  })
})
