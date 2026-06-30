import { describe, expect, it } from "vitest"
import { inferMovieSeriesName } from "@/lib/movie-series"

describe("inferMovieSeriesName", () => {
  it("infers Star Wars from episode-prefixed titles", () => {
    expect(inferMovieSeriesName("Star Wars: Episode IV - A New Hope")).toBe("Star Wars")
  })

  it("infers a series from hyphenated franchise titles", () => {
    expect(inferMovieSeriesName("Mission: Impossible - Fallout")).toBe("Mission: Impossible")
  })

  it("infers a series from colon-prefixed sequel titles", () => {
    expect(inferMovieSeriesName("Dune: Part Two")).toBe("Dune")
  })

  it("returns null for standalone titles", () => {
    expect(inferMovieSeriesName("Inception")).toBeNull()
  })
})
