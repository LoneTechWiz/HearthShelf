import { useEffect, useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { Button, Card, SecondaryButton, StatusText } from "./screen"
import { colors, spacing } from "../lib/theme"
import { lookupBookByIsbn, saveItem } from "../lib/api"

type ItemFormProps = {
  type: ItemType
  item?: MobileShelfItem
  isbn?: string
  onSaved: () => void
  onScanIsbn?: () => void
}

type FormState = Record<string, string>

function initialState(type: ItemType, item?: MobileShelfItem, isbn?: string): FormState {
  if (!item) return { title: "", isbn: isbn ?? "" }
  if (type === "book" && item.type === "book") {
    return {
      title: item.title,
      authors: item.authors ?? "",
      isbn: item.isbn ?? isbn ?? "",
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
  const titleMissing = !values.title?.trim()

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
          coverUrl: suggestion.coverUrl ?? "",
          description: suggestion.description ?? "",
        }))
      })
      .catch(() => null)
  }, [type, isbn, item])

  function setField(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
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
      <Field label="Title" value={values.title ?? ""} onChangeText={(value) => setField("title", value)} />
      {type === "book" ? (
        <>
          <Field label="Authors" value={values.authors ?? ""} onChangeText={(value) => setField("authors", value)} />
          <Field label="ISBN" value={values.isbn ?? ""} onChangeText={(value) => setField("isbn", value)} />
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
        label={saving ? "Saving..." : "Save"}
        disabled={saving || titleMissing}
        onPress={() => void submit()}
        fullWidth
      />
    </Card>
  )
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
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.edge,
    borderRadius: 8,
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
