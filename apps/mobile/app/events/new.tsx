import { useCallback, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { ItemType, MobileShelfEvent, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { FormField } from "../../components/form-field"
import { Button, Card, ErrorState, LoadingState, Screen, SegmentedControl, StatusText } from "../../components/screen"
import { createEvent, getItems } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

const eventTypes: Array<{ label: string; value: MobileShelfEvent["type"] }> = [
  { label: "Book Club", value: "book_club" },
  { label: "Movie Night", value: "movie_night" },
  { label: "Game Night", value: "game_night" },
]

export default function NewEventScreen() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<MobileShelfEvent["type"]>("book_club")
  const [recurrence, setRecurrence] = useState<MobileShelfEvent["recurrence"]>("none")
  const [startsAt, setStartsAt] = useState(defaultStartsAt())
  const [itemType, setItemType] = useState<ItemType>("book")
  const [itemQuery, setItemQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const query = useCachedQuery<Record<ItemType, MobileShelfItem[]>>("event-options", useCallback(async () => {
    const [books, movies, games] = await Promise.all([getItems("book"), getItems("movie"), getItems("game")])
    return { book: books.items, movie: movies.items, game: games.items }
  }, []))

  function toggleItem(lendableItemId: string) {
    setSelected((current) => current.includes(lendableItemId)
      ? current.filter((id) => id !== lendableItemId)
      : [...current, lendableItemId])
  }

  async function submit() {
    const parsedDate = parseDateTime(startsAt)
    if (!title.trim() || !parsedDate) {
      setError(!title.trim() ? "Event name is required." : "Use date and time format YYYY-MM-DD HH:mm.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createEvent({ title, type, recurrence, startsAt: parsedDate.toISOString(), lendableItemIds: selected, notes })
      router.replace("/events")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create event")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGate>
      <Screen
        title="Create Event"
        subtitle="Plan something around one or more shelf items."
        back={{ label: "Events", onPress: () => router.canGoBack() ? router.back() : router.replace("/events") }}
      >
        {query.loading ? <LoadingState /> : null}
        {query.error ? <ErrorState message={query.error} onRetry={() => void query.reload()} /> : null}
        <Card>
          {error ? <StatusText tone="danger">{error}</StatusText> : null}
          <FormField label="Event name" value={title} onChangeText={setTitle} placeholder="July book club" />
          <Text style={styles.label}>Type</Text>
          <SegmentedControl options={eventTypes} value={type} onChange={setType} />
          <Text style={styles.label}>Repeats</Text>
          <SegmentedControl
            options={[{ label: "Once", value: "none" }, { label: "Weekly", value: "weekly" }, { label: "Monthly", value: "monthly" }]}
            value={recurrence}
            onChange={setRecurrence}
          />
          <FormField label="Date and time" value={startsAt} onChangeText={setStartsAt} placeholder="YYYY-MM-DD HH:mm" autoCapitalize="none" />
          <Text style={styles.label}>Shelf items (optional)</Text>
          <SegmentedControl
            options={[{ label: "Books", value: "book" }, { label: "Movies", value: "movie" }, { label: "Games", value: "game" }]}
            value={itemType}
            onChange={(value) => { setItemType(value); setItemQuery("") }}
          />
          <FormField label="Search items" value={itemQuery} onChangeText={setItemQuery} placeholder={`Search ${itemType}s...`} />
          {query.data?.[itemType]
            .filter((item) => item.title.toLowerCase().includes(itemQuery.trim().toLowerCase()))
            .map((item) => {
            const lendableItemId = item.lendableItemId
            if (!lendableItemId) return null
            const selectedItem = selected.includes(lendableItemId)
            return (
              <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selectedItem }} onPress={() => toggleItem(lendableItemId)} style={[styles.item, selectedItem && styles.itemSelected]}>
                {itemImage(item) ? <Image source={{ uri: itemImage(item)! }} style={styles.image} /> : null}
                <Text style={[styles.itemText, selectedItem && styles.itemTextSelected]} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.check}>{selectedItem ? "✓" : ""}</Text>
              </Pressable>
            )
          })}
          <FormField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Location, chapters, snacks..." />
          <Button disabled={saving || !title.trim()} fullWidth label={saving ? "Saving..." : "Create Event"} onPress={() => void submit()} />
        </Card>
      </Screen>
    </AuthGate>
  )
}

function itemImage(item: MobileShelfItem) {
  return item.type === "movie" ? item.posterUrl : item.coverUrl
}

function defaultStartsAt() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setMinutes(0, 0, 0)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16).replace("T", " ")
}

function parseDateTime(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]))
  return Number.isNaN(date.getTime()) ? null : date
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  item: { alignItems: "center", borderColor: colors.edge, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, minHeight: 50, padding: spacing.sm },
  itemSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  image: { backgroundColor: colors.surfaceRaised, borderRadius: radii.sm, height: 38, width: 27 },
  itemText: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: "700" },
  itemTextSelected: { color: colors.accent },
  check: { color: colors.accent, fontSize: 20, fontWeight: "800", width: 24 },
})
