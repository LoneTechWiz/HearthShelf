import { useCallback, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ItemType, MobileContact, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { FormField } from "../../components/form-field"
import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, SegmentedControl, StatusText } from "../../components/screen"
import { createCheckout, getContacts, getItems } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

type CheckoutData = {
  items: Record<ItemType, MobileShelfItem[]>
  contacts: MobileContact[]
}

export default function NewCheckoutScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ lendableItemId?: string; type?: string }>()
  const [type, setType] = useState<ItemType>(parseType(params.type))
  const [selectedItemId, setSelectedItemId] = useState(params.lendableItemId ?? "")
  const [itemQuery, setItemQuery] = useState("")
  const [contactId, setContactId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const query = useCachedQuery<CheckoutData>("checkout-options", useCallback(async () => {
    const [books, movies, games, contacts] = await Promise.all([
      getItems("book"), getItems("movie"), getItems("game"), getContacts(),
    ])
    return {
      items: {
        book: books.items.filter((item) => !item.isCheckedOut && item.lendableItemId),
        movie: movies.items.filter((item) => !item.isCheckedOut && item.lendableItemId),
        game: games.items.filter((item) => !item.isCheckedOut && item.lendableItemId),
      },
      contacts: contacts.contacts,
    }
  }, []))
  const items = query.data?.items[type] ?? []
  const filteredItems = itemQuery.trim()
    ? items.filter((item) => item.title.toLowerCase().includes(itemQuery.trim().toLowerCase()))
    : items

  async function submit() {
    if (!selectedItemId) return
    setSaving(true)
    setError(null)
    try {
      await createCheckout({ lendableItemId: selectedItemId, contactId, dueDate, notes })
      router.replace("/(tabs)/checkouts")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check out item")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGate>
      <Screen
        title="Check Out an Item"
        subtitle="Track who has an item and when it is due."
        back={{ label: "Checkouts", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/checkouts") }}
      >
        {query.loading ? <LoadingState /> : null}
        {query.error ? <ErrorState message={query.error} onRetry={() => void query.reload()} /> : null}
        {query.data ? (
          <Card>
            {error ? <StatusText tone="danger">{error}</StatusText> : null}
            <Text style={styles.label}>Item</Text>
            <SegmentedControl
              options={[{ label: "Books", value: "book" }, { label: "Movies", value: "movie" }, { label: "Games", value: "game" }]}
              value={type}
              onChange={(value) => { setType(value); setSelectedItemId(""); setItemQuery("") }}
            />
            <FormField label="Search items" value={itemQuery} onChangeText={setItemQuery} placeholder={`Search ${type}s...`} />
            {filteredItems.length ? filteredItems.map((item) => (
              <ChoiceRow
                key={item.id}
                imageUrl={item.type === "movie" ? item.posterUrl : item.coverUrl}
                label={item.title}
                selected={selectedItemId === item.lendableItemId}
                onPress={() => setSelectedItemId(item.lendableItemId!)}
              />
            )) : <EmptyState title="No available items" message={itemQuery ? "No available items match your search." : `All ${type}s are currently checked out.`} />}

            <Text style={styles.label}>Borrower</Text>
            <ChoiceRow label="Myself" selected={contactId === null} onPress={() => setContactId(null)} />
            {query.data.contacts.map((contact) => (
              <ChoiceRow key={contact.id} label={contact.name} selected={contactId === contact.id} onPress={() => setContactId(contact.id)} />
            ))}

            <FormField label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
            <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
            <Button disabled={saving || !selectedItemId} fullWidth label={saving ? "Saving..." : "Check Out"} onPress={() => void submit()} />
          </Card>
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function ChoiceRow({ label, imageUrl, selected, onPress }: { label: string; imageUrl?: string | null; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]} numberOfLines={2}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  )
}

function parseType(value: string | undefined): ItemType {
  return value === "movie" || value === "game" ? value : "book"
}

function defaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: spacing.xs },
  choice: { alignItems: "center", borderColor: colors.edge, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, minHeight: 50, padding: spacing.sm },
  choiceSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  choiceText: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: "700" },
  choiceTextSelected: { color: colors.accent },
  image: { backgroundColor: colors.surfaceRaised, borderRadius: radii.sm, height: 38, width: 27 },
  radio: { alignItems: "center", borderColor: colors.faint, borderRadius: radii.pill, borderWidth: 1, height: 20, justifyContent: "center", width: 20 },
  radioSelected: { borderColor: colors.accent },
  radioDot: { backgroundColor: colors.accent, borderRadius: radii.pill, height: 10, width: 10 },
})
