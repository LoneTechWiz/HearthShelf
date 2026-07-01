import { useRouter } from "expo-router"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import type { MobileShelfItem } from "@my-shelf/types"
import { colors, spacing } from "../lib/theme"

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
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: "/item/[type]/[id]", params: { type: item.type, id: item.id } })}
    >
        <View style={styles.row}>
          {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={styles.placeholder} />}
          <View style={styles.text}>
            <Text style={styles.title}>{item.title}</Text>
            {subtitle(item) ? <Text style={styles.subtitle}>{subtitle(item)}</Text> : null}
            <Text style={item.isCheckedOut ? styles.checkedOut : styles.available}>
              {item.isCheckedOut ? "Checked out" : "Available"}
            </Text>
          </View>
        </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  image: {
    backgroundColor: colors.edge,
    borderRadius: 6,
    height: 72,
    width: 52,
  },
  placeholder: {
    backgroundColor: colors.edge,
    borderRadius: 6,
    height: 72,
    width: 52,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  available: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  checkedOut: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
})
