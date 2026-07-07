import { useCallback, useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { ItemRow } from "../../components/item-row"
import { EmptyState, ErrorState, LoadingState, Screen } from "../../components/screen"
import { getItems } from "../../lib/api"
import { colors, radii, spacing } from "../../lib/theme"
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
  const load = useCallback(() => getItems(type), [type])
  const { data, loading, error, reload } = useCachedQuery(`items:${type}`, load)
  const items = data?.items ?? []

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
        <View style={styles.segment}>
          {types.map((itemType) => (
            <Pressable
              key={itemType}
              style={({ pressed }) => [
                styles.segmentButton,
                itemType === type && styles.segmentButtonActive,
                pressed && itemType !== type && styles.segmentButtonPressed,
              ]}
              onPress={() => setType(itemType)}
            >
              <Text style={itemType === type ? styles.segmentTextActive : styles.segmentText}>
                {labels[itemType].plural}
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState
            title={`No ${labels[type].plural.toLowerCase()} yet`}
            message={`Add a ${labels[type].singular.toLowerCase()} to start building this shelf.`}
          />
        ) : null}
        {items.map((item: MobileShelfItem) => <ItemRow key={`${item.type}:${item.id}`} item={item} />)}
      </Screen>
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: spacing.xs,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radii.md,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  segmentButtonPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  segmentButtonActive: {
    backgroundColor: colors.accentSoft,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
  },
})
