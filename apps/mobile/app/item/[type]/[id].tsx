import { useCallback } from "react"
import { Alert, Image, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../../components/auth-gate"
import { ReviewPanel } from "../../../components/review-panel"
import { Card, DangerButton, ErrorState, LoadingState, Pill, Screen, SecondaryButton, StatusBadge } from "../../../components/screen"
import { deleteItem, getItem } from "../../../lib/api"
import { colors, radii, spacing } from "../../../lib/theme"
import { useCachedQuery } from "../../../lib/use-cached-query"

function isItemType(value: string): value is ItemType {
  return value === "book" || value === "movie" || value === "game"
}

export default function ItemDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ type: string; id: string }>()
  const type = isItemType(params.type) ? params.type : "book"
  const id = params.id
  const load = useCallback(() => getItem(type, id), [type, id])
  const { data, loading, error, reload } = useCachedQuery(`item:${type}:${id}`, load)
  const item = data?.item
  const title = item?.title ?? "Item details"

  return (
    <AuthGate>
      <Screen
        title={title}
        subtitle={(item ? detailSubtitle(item) : type) ?? undefined}
        back={{ label: "Shelf", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/shelf") }}
        action={item ? {
          label: "Edit",
          onPress: () => router.push({ pathname: "/item/[type]/[id]/edit", params: { type, id } }),
        } : undefined}
      >
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {item ? (
          <ItemDetails
            item={item}
            onCheckout={() => router.push({ pathname: "/checkouts/new", params: { lendableItemId: item.lendableItemId!, type: item.type } })}
            onDelete={() => {
              Alert.alert("Delete item?", "This removes the item from your shelf.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    void deleteItem(type, id).then(() => router.replace("/(tabs)/shelf"))
                  },
                },
              ])
            }}
          />
        ) : null}
        {item?.lendableItemId ? <ReviewPanel lendableItemId={item.lendableItemId} /> : null}
      </Screen>
    </AuthGate>
  )
}

function ItemDetails({ item, onDelete, onCheckout }: { item: MobileShelfItem; onDelete: () => void; onCheckout: () => void }) {
  const image = item.type === "movie" ? item.posterUrl : item.coverUrl
  const meta = metadata(item)

  return (
    <Card>
      <View style={styles.hero}>
        <View style={styles.coverFrame}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{item.type.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.heroText}>
          <View style={styles.pills}>
            <Pill label={item.type} tone="accent" />
            <StatusBadge checkedOut={item.isCheckedOut} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          {detailSubtitle(item) ? <Text style={styles.muted}>{detailSubtitle(item)}</Text> : null}
        </View>
      </View>
      {meta.length ? (
        <View style={styles.metaGrid}>
          {meta.map((entry) => (
            <View key={entry.label} style={styles.metaItem}>
              <Text style={styles.metaLabel}>{entry.label}</Text>
              <Text style={styles.metaValue} numberOfLines={2}>{entry.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {"description" in item && item.description ? (
        <View style={styles.descriptionBlock}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      ) : null}
      {!item.isCheckedOut && item.lendableItemId ? <SecondaryButton label="Check Out" onPress={onCheckout} fullWidth /> : null}
      <DangerButton label="Delete Item" onPress={onDelete} fullWidth />
    </Card>
  )
}

function detailSubtitle(item: MobileShelfItem) {
  if (item.type === "book") return item.authors
  if (item.type === "movie") return [item.director, item.year].filter(Boolean).join(" · ") || null
  if (item.type === "game") return item.genre
  return null
}

function metadata(item: MobileShelfItem) {
  if (item.type === "book") {
    return [
      item.isbn ? { label: "ISBN", value: item.isbn } : null,
      item.seriesName ? { label: "Series", value: seriesLabel(item.seriesName, item.seriesPosition, item.seriesTotal) } : null,
      item.genre ? { label: "Genre", value: item.genre } : null,
    ].filter((entry): entry is { label: string; value: string } => Boolean(entry))
  }
  if (item.type === "movie") {
    return [
      item.year ? { label: "Year", value: `${item.year}` } : null,
      item.seriesName ? { label: "Series", value: item.seriesName } : null,
      item.format ? { label: "Format", value: item.format } : null,
      item.runtime ? { label: "Runtime", value: `${item.runtime} min` } : null,
      item.genre ? { label: "Genre", value: item.genre } : null,
    ].filter((entry): entry is { label: string; value: string } => Boolean(entry))
  }
  return [
    item.minPlayers || item.maxPlayers
      ? { label: "Players", value: `${item.minPlayers ?? "?"}-${item.maxPlayers ?? "?"}` }
      : null,
    item.ageRating ? { label: "Age", value: item.ageRating } : null,
    item.genre ? { label: "Genre", value: item.genre } : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry))
}

function seriesLabel(name: string, position: number | null, total: number | null) {
  if (!position && !total) return name
  return `${name} #${position ?? "?"}${total ? ` of ${total}` : ""}`
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  coverFrame: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 188,
    overflow: "hidden",
    width: 128,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    flex: 1,
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: "800",
  },
  heroText: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minWidth: 0,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 27,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaItem: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    flexGrow: 1,
    minWidth: "46%",
    padding: spacing.md,
  },
  metaLabel: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  descriptionBlock: {
    borderTopColor: colors.edge,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
})
