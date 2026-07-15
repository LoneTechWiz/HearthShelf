import { useCallback, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { MobileCollection, MobileCollectionItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { Card, EmptyState, ErrorState, LoadingState, Pill, Screen, SegmentedControl } from "../../components/screen"
import { getCollections } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

type Shelf = "books" | "movies" | "games"
type Group = "authors" | "series" | "genres" | "categories" | "players"

const groupOptions: Record<Shelf, Array<{ label: string; value: Group }>> = {
  books: [{ label: "Authors", value: "authors" }, { label: "Series", value: "series" }],
  movies: [{ label: "Series", value: "series" }, { label: "Genres", value: "genres" }],
  games: [{ label: "Categories", value: "categories" }, { label: "Players", value: "players" }],
}

export default function CollectionsScreen() {
  const load = useCallback(() => getCollections(), [])
  const { data, loading, error, reload } = useCachedQuery("collections", load)
  const [shelf, setShelf] = useState<Shelf>("books")
  const [groups, setGroups] = useState<Record<Shelf, Group>>({
    books: "authors",
    movies: "series",
    games: "categories",
  })
  const group = groups[shelf]
  const collections = data ? collectionsFor(data, shelf, group) : []

  return (
    <AuthGate>
      <Screen title="Collections" subtitle="Browse grouped views across books, movies, and games.">
        <SegmentedControl
          options={([
            { label: "Books", value: "books" },
            { label: "Movies", value: "movies" },
            { label: "Games", value: "games" },
          ] as const)}
          value={shelf}
          onChange={setShelf}
        />
        <SegmentedControl
          options={groupOptions[shelf]}
          value={group}
          onChange={(value) => setGroups((current) => ({ ...current, [shelf]: value }))}
        />
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {!loading && !error && collections.length === 0 ? (
          <EmptyState
            title={`No ${shelf} collections yet`}
            message={`Add metadata to your ${shelf} to build grouped collections.`}
          />
        ) : null}
        {collections.map((collection) => (
          <CollectionCard key={collection.name} collection={collection} />
        ))}
      </Screen>
    </AuthGate>
  )
}

function collectionsFor(
  data: Awaited<ReturnType<typeof getCollections>>,
  shelf: Shelf,
  group: Group
) {
  if (shelf === "books") {
    if (group === "series") return data.books?.series ?? summarizeLegacy(data.series)
    return data.books?.authors ?? summarizeLegacy(data.authors)
  }
  if (shelf === "movies") {
    if (group === "genres") return data.movies?.genres ?? []
    return data.movies?.series ?? summarizeLegacy(data.movieSeries)
  }
  if (group === "players") return data.games?.players ?? []
  return data.games?.categories ?? summarizeLegacy(data.gameGenres)
}

function summarizeLegacy(rows: Array<{ key: string; label: string; count: number }> | undefined): MobileCollection[] {
  return (rows ?? []).map((row) => ({
    name: row.label,
    ownedCount: row.count,
    items: [],
  }))
}

function CollectionCard({ collection }: { collection: MobileCollection }) {
  const total = collection.totalCount
  const percent = total ? Math.min(100, Math.round((collection.ownedCount / total) * 100)) : null

  return (
    <Card style={styles.collectionCard}>
      <View style={styles.collectionHeader}>
        <View style={styles.headerText}>
          <Text style={styles.collectionTitle}>{collection.name}</Text>
          <Text style={styles.muted}>
            {total ? `${collection.ownedCount} of ${total} owned` : `${collection.ownedCount} unique`}
          </Text>
        </View>
        {percent !== null ? <Pill label={`${percent}%`} tone="accent" /> : null}
      </View>
      {percent !== null ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${percent}%` }]} />
        </View>
      ) : null}
      <View>
        {collection.items.map((item, index) => (
          <CollectionItemRow
            key={item.identity}
            item={item}
            divided={index < collection.items.length - 1}
          />
        ))}
      </View>
    </Card>
  )
}

function CollectionItemRow({ item, divided }: { item: MobileCollectionItem; divided: boolean }) {
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/item/[type]/[id]", params: { type: item.type, id: item.id } })}
      style={({ pressed }) => [styles.itemRow, divided && styles.divider, pressed && styles.rowPressed]}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>{item.type.slice(0, 1).toUpperCase()}</Text></View>
      )}
      <View style={styles.itemText}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.position ? `${item.position}. ` : ""}{item.title}
        </Text>
        {item.subtitle ? <Text style={styles.muted} numberOfLines={1}>{item.subtitle}</Text> : null}
      </View>
      {item.copyCount > 1 ? <Pill label={`${item.copyCount} copies`} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  collectionCard: { gap: spacing.md, paddingBottom: 0 },
  collectionHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  headerText: { flex: 1, minWidth: 0 },
  collectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  progressTrack: { backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, height: 7, overflow: "hidden" },
  progressBar: { backgroundColor: colors.accent, borderRadius: radii.pill, height: 7 },
  itemRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, minHeight: 68, paddingVertical: spacing.sm },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  divider: { borderBottomColor: colors.edge, borderBottomWidth: 1 },
  image: { backgroundColor: colors.surfaceRaised, borderRadius: radii.sm, height: 48, width: 34 },
  placeholder: { alignItems: "center", backgroundColor: colors.surfaceRaised, borderRadius: radii.sm, height: 48, justifyContent: "center", width: 34 },
  placeholderText: { color: colors.faint, fontSize: 15, fontWeight: "800" },
  itemText: { flex: 1, minWidth: 0 },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", lineHeight: 19 },
})
