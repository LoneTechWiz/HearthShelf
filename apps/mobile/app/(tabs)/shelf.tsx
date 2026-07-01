import { useCallback, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { ItemRow } from "../../components/item-row"
import { EmptyState, ErrorState, LoadingState, Screen } from "../../components/screen"
import { getItems } from "../../lib/api"
import { colors, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

const types: ItemType[] = ["book", "movie", "game"]

export default function ShelfScreen() {
  const router = useRouter()
  const [type, setType] = useState<ItemType>("book")
  const load = useCallback(() => getItems(type), [type])
  const { data, loading, error, reload } = useCachedQuery(`items:${type}`, load)
  const items = data?.items ?? []

  return (
    <AuthGate>
      <Screen
        title="Shelf"
        subtitle="Browse books, movies, and games."
        action={{ label: "Add", onPress: () => router.push({ pathname: "/item/new", params: { type } }) }}
      >
        <View style={styles.segment}>
          {types.map((itemType) => (
            <Pressable
              key={itemType}
              style={[styles.segmentButton, itemType === type && styles.segmentButtonActive]}
              onPress={() => setType(itemType)}
            >
              <Text style={itemType === type ? styles.segmentTextActive : styles.segmentText}>
                {itemType}s
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {!loading && !error && items.length === 0 ? <EmptyState message="Nothing on this shelf yet." /> : null}
        {items.map((item: MobileShelfItem) => <ItemRow key={`${item.type}:${item.id}`} item={item} />)}
      </Screen>
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: spacing.xs,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: colors.primaryInk,
    fontWeight: "700",
    textTransform: "capitalize",
  },
})
