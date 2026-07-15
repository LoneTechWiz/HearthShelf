import { useEffect, useState } from "react"
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { Button, Card, SecondaryButton, StatusText } from "./screen"
import { colors, radii, spacing, typography } from "../lib/theme"
import {
  getGameByBggId,
  getMovieByImdbId,
  lookupBookByIsbn,
  saveItem,
  searchBooksByTitle,
  searchGamesByTitle,
  searchMoviesByTitle,
  type BookSuggestion,
  type GameSuggestion,
  type MovieSuggestion,
} from "../lib/api"

type ItemFormProps = {
  type: ItemType
  item?: MobileShelfItem
  isbn?: string
  onSaved: () => void
  onScanIsbn?: () => void
}

type FormState = Record<string, string>
type TitleSuggestion =
  | ({ type: "book" } & BookSuggestion)
  | ({ type: "movie" } & MovieSuggestion)
  | ({ type: "game" } & GameSuggestion)

function initialState(type: ItemType, item?: MobileShelfItem, isbn?: string): FormState {
  if (!item) return { title: "", isbn: isbn ?? "" }
  if (type === "book" && item.type === "book") {
    return {
      title: item.title,
      authors: item.authors ?? "",
      isbn: item.isbn ?? isbn ?? "",
      seriesKey: item.seriesKey ?? "",
      seriesName: item.seriesName ?? "",
      seriesPosition: item.seriesPosition?.toString() ?? "",
      seriesTotal: item.seriesTotal?.toString() ?? "",
      coverUrl: item.coverUrl ?? "",
      description: item.description ?? "",
      genre: item.genre ?? "",
    }
  }
  if (type === "movie" && item.type === "movie") {
    return {
      title: item.title,
      director: item.director ?? "",
      year: item.year?.toString() ?? "",
      seriesName: item.seriesName ?? "",
      posterUrl: item.posterUrl ?? "",
      format: item.format ?? "",
      runtime: item.runtime?.toString() ?? "",
      description: item.description ?? "",
      genre: item.genre ?? "",
    }
  }
  if (type === "game" && item.type === "game") {
    return {
      title: item.title,
      minPlayers: item.minPlayers?.toString() ?? "",
      maxPlayers: item.maxPlayers?.toString() ?? "",
      ageRating: item.ageRating ?? "",
      coverUrl: item.coverUrl ?? "",
      description: item.description ?? "",
      genre: item.genre ?? "",
    }
  }
  return { title: "" }
}

export function ItemForm({ type, item, isbn, onSaved, onScanIsbn }: ItemFormProps) {
  const [values, setValues] = useState(() => initialState(type, item, isbn))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const titleMissing = !values.title?.trim()

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSuggestions([])
      setSearching(false)
      setSearchError(null)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError(null)
      try {
        const results = type === "book"
          ? (await searchBooksByTitle(query)).map((suggestion) => ({ ...suggestion, type } as const))
          : type === "movie"
            ? (await searchMoviesByTitle(query)).map((suggestion) => ({ ...suggestion, type } as const))
            : (await searchGamesByTitle(query)).map((suggestion) => ({ ...suggestion, type } as const))
        if (!cancelled) setSuggestions(results)
      } catch {
        if (!cancelled) {
          setSuggestions([])
          setSearchError("Search failed. You can still enter the item manually.")
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery, type])

  useEffect(() => {
    if (type !== "book" || !isbn || item) return
    setValues((current) => ({ ...current, isbn }))
    lookupBookByIsbn(isbn)
      .then(({ suggestion }) => {
        if (!suggestion) return
        setValues((current) => ({
          ...current,
          title: suggestion.title,
          authors: suggestion.authors,
          isbn: suggestion.isbn ?? isbn,
          seriesName: suggestion.seriesName ?? "",
          seriesPosition: suggestion.seriesPosition?.toString() ?? "",
          seriesTotal: suggestion.seriesTotal?.toString() ?? "",
          genre: suggestion.genre ?? "",
          coverUrl: suggestion.coverUrl ?? "",
          description: suggestion.description ?? "",
        }))
      })
      .catch(() => null)
  }, [type, isbn, item])

  function setField(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function lookupEnteredIsbn() {
    const currentIsbn = values.isbn?.trim()
    if (!currentIsbn) return
    setLookingUp(true)
    setSearchError(null)
    try {
      const { suggestion } = await lookupBookByIsbn(currentIsbn)
      if (!suggestion) {
        setSearchError("No book found for this ISBN.")
        return
      }
      setValues((current) => ({
        ...current,
        title: suggestion.title,
        authors: suggestion.authors,
        isbn: suggestion.isbn ?? currentIsbn,
        seriesKey: suggestion.seriesKey ?? "",
        seriesName: suggestion.seriesName ?? "",
        seriesPosition: suggestion.seriesPosition?.toString() ?? "",
        seriesTotal: suggestion.seriesTotal?.toString() ?? "",
        genre: suggestion.genre ?? "",
        coverUrl: suggestion.coverUrl ?? "",
        description: suggestion.description ?? "",
      }))
    } catch {
      setSearchError("ISBN lookup failed. You can complete the fields manually.")
    } finally {
      setLookingUp(false)
    }
  }

  async function selectSuggestion(suggestion: TitleSuggestion) {
    setSearchQuery("")
    setSuggestions([])
    setLookingUp(suggestion.type !== "book")

    if (suggestion.type === "book") {
      setValues((current) => ({
        ...current,
        title: suggestion.title,
        authors: suggestion.authors,
        isbn: suggestion.isbn ?? "",
        seriesKey: suggestion.seriesKey ?? "",
        seriesName: suggestion.seriesName ?? "",
        seriesPosition: suggestion.seriesPosition?.toString() ?? "",
        seriesTotal: suggestion.seriesTotal?.toString() ?? "",
        genre: suggestion.genre ?? "",
        coverUrl: suggestion.coverUrl ?? "",
        description: suggestion.description ?? "",
      }))
      return
    }

    if (suggestion.type === "movie") {
      setValues((current) => ({
        ...current,
        title: suggestion.title,
        year: suggestion.year.match(/^\d{4}$/)?.[0] ?? "",
        posterUrl: suggestion.posterUrl ?? "",
      }))
      try {
        const detail = await getMovieByImdbId(suggestion.imdbId)
        if (detail) {
          setValues((current) => ({
            ...current,
            title: detail.title || suggestion.title,
            seriesName: detail.seriesName ?? "",
            director: detail.director ?? "",
            year: detail.year?.toString() ?? current.year,
            posterUrl: detail.posterUrl ?? suggestion.posterUrl ?? "",
            genre: detail.genre ?? "",
            runtime: detail.runtime?.toString() ?? "",
            description: detail.description ?? "",
          }))
        }
      } catch {
        setSearchError("Details could not be loaded. You can complete the fields manually.")
      } finally {
        setLookingUp(false)
      }
      return
    }

    setValues((current) => ({
      ...current,
      title: suggestion.title,
      coverUrl: suggestion.coverUrl ?? "",
    }))
    try {
      const detail = await getGameByBggId(suggestion.bggId)
      if (detail) {
        setValues((current) => ({
          ...current,
          title: detail.title || suggestion.title,
          coverUrl: detail.coverUrl ?? suggestion.coverUrl ?? "",
          minPlayers: detail.minPlayers?.toString() ?? "",
          maxPlayers: detail.maxPlayers?.toString() ?? "",
          ageRating: detail.ageRating ?? "",
          genre: detail.genre ?? "",
          description: detail.description ?? "",
        }))
      }
    } catch {
      setSearchError("Details could not be loaded. You can complete the fields manually.")
    } finally {
      setLookingUp(false)
    }
  }

  async function submit() {
    if (titleMissing) return
    setSaving(true)
    setError(null)
    try {
      await saveItem(type, values, item?.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save item")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.searchField}>
        <Field
          label="Title"
          value={values.title ?? ""}
          onChangeText={(value) => {
            setField("title", value)
            setSearchQuery(value)
          }}
        />
        {searching ? <ActivityIndicator color={colors.accent} style={styles.searchSpinner} /> : null}
        {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
        {suggestions.length ? (
          <View style={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestionKey(suggestion)}
                accessibilityRole="button"
                onPress={() => void selectSuggestion(suggestion)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
              >
                {suggestionImage(suggestion) ? (
                  <Image source={{ uri: suggestionImage(suggestion)! }} style={styles.suggestionImage} />
                ) : (
                  <View style={styles.suggestionPlaceholder} />
                )}
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>{suggestion.title}</Text>
                  <Text style={styles.suggestionMeta} numberOfLines={1}>{suggestionSubtitle(suggestion)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {type === "book" ? (
        <>
          <Field label="Authors" value={values.authors ?? ""} onChangeText={(value) => setField("authors", value)} />
          <Field label="ISBN" value={values.isbn ?? ""} onChangeText={(value) => setField("isbn", value)} />
          <SecondaryButton
            disabled={lookingUp || !values.isbn?.trim()}
            label={lookingUp ? "Looking Up..." : "Look Up ISBN"}
            onPress={() => void lookupEnteredIsbn()}
            fullWidth
          />
          {onScanIsbn ? <SecondaryButton label="Scan ISBN" onPress={onScanIsbn} fullWidth /> : null}
          <Field label="Series" value={values.seriesName ?? ""} onChangeText={(value) => setField("seriesName", value)} />
          <Field label="Series position" value={values.seriesPosition ?? ""} keyboardType="number-pad" onChangeText={(value) => setField("seriesPosition", value)} />
          <Field label="Series total" value={values.seriesTotal ?? ""} keyboardType="number-pad" onChangeText={(value) => setField("seriesTotal", value)} />
        </>
      ) : null}
      {type === "movie" ? (
        <>
          <Field label="Director" value={values.director ?? ""} onChangeText={(value) => setField("director", value)} />
          <Field label="Year" value={values.year ?? ""} keyboardType="number-pad" onChangeText={(value) => setField("year", value)} />
          <Field label="Series" value={values.seriesName ?? ""} onChangeText={(value) => setField("seriesName", value)} />
          <Field label="Format" value={values.format ?? ""} onChangeText={(value) => setField("format", value)} />
          <Field label="Runtime" value={values.runtime ?? ""} keyboardType="number-pad" onChangeText={(value) => setField("runtime", value)} />
        </>
      ) : null}
      {type === "game" ? (
        <>
          <Field label="Minimum players" value={values.minPlayers ?? ""} keyboardType="number-pad" onChangeText={(value) => setField("minPlayers", value)} />
          <Field label="Maximum players" value={values.maxPlayers ?? ""} keyboardType="number-pad" onChangeText={(value) => setField("maxPlayers", value)} />
          <Field label="Age rating" value={values.ageRating ?? ""} onChangeText={(value) => setField("ageRating", value)} />
        </>
      ) : null}
      <Field label="Genre" value={values.genre ?? ""} onChangeText={(value) => setField("genre", value)} />
      <Field label={type === "movie" ? "Poster URL" : "Cover URL"} value={(values.posterUrl ?? values.coverUrl) ?? ""} onChangeText={(value) => setField(type === "movie" ? "posterUrl" : "coverUrl", value)} />
      <Field label="Description" value={values.description ?? ""} multiline onChangeText={(value) => setField("description", value)} />
      {titleMissing ? <StatusText tone="danger">Title is required.</StatusText> : null}
      <Button
        label={saving ? "Saving..." : lookingUp ? "Loading details..." : "Save"}
        disabled={saving || lookingUp || titleMissing}
        onPress={() => void submit()}
        fullWidth
      />
    </Card>
  )
}

function suggestionKey(suggestion: TitleSuggestion) {
  if (suggestion.type === "book") return `book:${suggestion.key}`
  if (suggestion.type === "movie") return `movie:${suggestion.imdbId}`
  return `game:${suggestion.bggId}`
}

function suggestionImage(suggestion: TitleSuggestion) {
  if (suggestion.type === "movie") return suggestion.posterUrl
  return suggestion.coverUrl ?? null
}

function suggestionSubtitle(suggestion: TitleSuggestion) {
  if (suggestion.type === "book") return suggestion.authors || "Book"
  return suggestion.year ? `${suggestion.type === "movie" ? "Movie" : "Game"} · ${suggestion.year}` : suggestion.type
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  keyboardType?: "default" | "number-pad"
  multiline?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.faint}
        selectionColor={colors.accent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchField: {
    gap: spacing.xs,
  },
  searchSpinner: {
    position: "absolute",
    right: spacing.md,
    top: 40,
  },
  searchError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  suggestion: {
    alignItems: "center",
    borderBottomColor: colors.edge,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    padding: spacing.sm,
  },
  suggestionPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  suggestionImage: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    height: 42,
    width: 30,
  },
  suggestionPlaceholder: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    height: 42,
    width: 30,
  },
  suggestionText: {
    flex: 1,
    minWidth: 0,
  },
  suggestionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  suggestionMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.ink,
    ...typography.label,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
})
