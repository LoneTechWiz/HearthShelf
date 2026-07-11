import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import type { MobileShelfItem } from "@my-shelf/types"
import { Pill, StatusBadge } from "./screen"
import { colors, pressableRipple, radii, shadows, spacing } from "../lib/theme"

function itemImage(item: MobileShelfItem): string | null {
  if (item.type === "movie") return item.posterUrl
  return item.coverUrl
}

function subtitle(item: MobileShelfItem): string | null {
  if (item.type === "book") return item.authors
  if (item.type === "movie") return [item.director, item.year].filter(Boolean).join(" | ") || null
  if (item.minPlayers || item.maxPlayers) {
    return `${item.minPlayers ?? "?"}-${item.maxPlayers ?? "?"} players`
  }
  return item.genre
}

export function ItemRow({ item }: { item: MobileShelfItem }) {
  const router = useRouter()
  const image = itemImage(item)
  const itemSubtitle = subtitle(item)
  return (
    <Pressable
      accessibilityLabel={`Open ${item.title}`}
      accessibilityRole="button"
      android_ripple={pressableRipple}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: "/item/[type]/[id]", params: { type: item.type, id: item.id } })}
    >
      <View style={styles.row}>
        <View style={styles.coverFrame}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{item.type.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.text}>
          <View style={styles.metaRow}>
            <Pill label={item.type} />
            <StatusBadge checkedOut={item.isCheckedOut} />
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {itemSubtitle ? <Text style={styles.subtitle} numberOfLines={1}>{itemSubtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    cursor: "pointer",
    padding: spacing.md,
    ...shadows.card,
  },
  cardPressed: {
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.99 }],
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  coverFrame: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 82,
    overflow: "hidden",
    width: 58,
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
    fontSize: 22,
    fontWeight: "800",
  },
  text: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
})
