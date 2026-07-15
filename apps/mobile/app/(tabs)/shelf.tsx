import { useCallback, useEffect, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { ItemRow } from "../../components/item-row"
import { EmptyState, ErrorState, LoadingState, Screen, SegmentedControl, StatusBadge } from "../../components/screen"
import { getItems } from "../../lib/api"
import { colors, radii, shadows, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

const types: ItemType[] = ["book", "movie", "game"]
const labels: Record<ItemType, { singular: string; plural: string }> = {
  book: { singular: "Book", plural: "Books" },
  movie: { singular: "Movie", plural: "Movies" },
  game: { singular: "Game", plural: "Games" },
}

function parseType(value: string | string[] | undefined): ItemType | null {
  if (value === "book" || value === "movie" || value === "game") return value
  return null
}

export default function ShelfScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ type?: string }>()
  const [type, setType] = useState<ItemType>("book")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")
  const load = useCallback(() => getItems(type), [type])
  const { data, loading, error, reload } = useCachedQuery(`items:${type}`, load)
  const items = data?.items ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = normalizedQuery
    ? items.filter((item) => searchableText(item).includes(normalizedQuery))
    : items

  useEffect(() => {
    const nextType = parseType(params.type)
    if (nextType) setType(nextType)
  }, [params.type])

  return (
    <AuthGate>
      <Screen
        title="Shelf"
        subtitle={
          data
            ? `${items.length} ${items.length === 1 ? labels[type].singular.toLowerCase() : labels[type].plural.toLowerCase()}`
            : "Browse books, movies, and games."
        }
        action={{ label: `Add ${labels[type].singular}`, onPress: () => router.push({ pathname: "/item/new", params: { type } }) }}
      >
        <SegmentedControl
          options={types.map((itemType) => ({ label: labels[itemType].plural, value: itemType }))}
          value={type}
          onChange={setType}
        />
        <View style={styles.controls}>
          <TextInput
            accessibilityLabel={`Search ${labels[type].plural.toLowerCase()}`}
            placeholder={`Search ${labels[type].plural.toLowerCase()}...`}
            placeholderTextColor={colors.faint}
            selectionColor={colors.accent}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
          <SegmentedControl
            options={[{ label: "List", value: "list" }, { label: "Grid", value: "grid" }]}
            value={view}
            onChange={setView}
          />
        </View>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {!loading && !error && filteredItems.length === 0 ? (
          <EmptyState
            title={query ? "No matches" : `No ${labels[type].plural.toLowerCase()} yet`}
            message={query
              ? `Nothing on this shelf matches “${query}”.`
              : `Add a ${labels[type].singular.toLowerCase()} to start building this shelf.`}
          />
        ) : null}
        {view === "list" ? (
          filteredItems.map((item: MobileShelfItem) => <ItemRow key={`${item.type}:${item.id}`} item={item} />)
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item) => <GridItem key={`${item.type}:${item.id}`} item={item} />)}
          </View>
        )}
      </Screen>
    </AuthGate>
  )
}

function searchableText(item: MobileShelfItem) {
  if (item.type === "book") return `${item.title} ${item.authors ?? ""}`.toLowerCase()
  if (item.type === "movie") return `${item.title} ${item.director ?? ""}`.toLowerCase()
  return item.title.toLowerCase()
}

function GridItem({ item }: { item: MobileShelfItem }) {
  const router = useRouter()
  const imageUrl = item.type === "movie" ? item.posterUrl : item.coverUrl
  return (
    <Pressable
      accessibilityLabel={`Open ${item.title}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/item/[type]/[id]", params: { type: item.type, id: item.id } })}
      style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
    >
      <View style={styles.gridImageFrame}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}><Text style={styles.gridPlaceholderText}>{item.title}</Text></View>
        )}
        <View style={styles.status}><StatusBadge checkedOut={item.isCheckedOut} /></View>
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  controls: { gap: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: { gap: spacing.sm, width: "47.5%" },
  gridItemPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  gridImageFrame: {
    aspectRatio: 2 / 3,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.card,
  },
  gridImage: { height: "100%", width: "100%" },
  gridPlaceholder: { alignItems: "center", flex: 1, justifyContent: "center", padding: spacing.md },
  gridPlaceholderText: { color: colors.ink, fontSize: 15, fontWeight: "800", textAlign: "center" },
  status: { position: "absolute", right: spacing.sm, top: spacing.sm },
  gridTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", lineHeight: 19 },
})
