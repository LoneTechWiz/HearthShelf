import { useCallback } from "react"
import { Alert, Image, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../../components/auth-gate"
import { Button, Card, ErrorState, LoadingState, Screen, SecondaryButton } from "../../../components/screen"
import { deleteItem, getItem } from "../../../lib/api"
import { colors, spacing } from "../../../lib/theme"
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

  return (
    <AuthGate>
      <Screen title={item?.title ?? "Item details"} subtitle={type}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {item ? (
          <>
            <View style={styles.actions}>
              <Button
                label="Edit"
                onPress={() => router.push({ pathname: "/item/[type]/[id]/edit", params: { type, id } })}
              />
              <SecondaryButton
                label="Delete"
                onPress={() => {
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
            </View>
            <ItemDetails item={item} />
          </>
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function ItemDetails({ item }: { item: MobileShelfItem }) {
  const image = item.type === "movie" ? item.posterUrl : item.coverUrl
  return (
    <Card>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <Text style={styles.title}>{item.title}</Text>
      {item.type === "book" && item.authors ? <Text style={styles.muted}>{item.authors}</Text> : null}
      {item.type === "movie" && item.director ? <Text style={styles.muted}>{item.director}</Text> : null}
      {item.type === "game" && item.genre ? <Text style={styles.muted}>{item.genre}</Text> : null}
      <Text style={item.isCheckedOut ? styles.checkedOut : styles.available}>
        {item.isCheckedOut ? "Checked out" : "Available"}
      </Text>
      {"description" in item && item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  image: {
    alignSelf: "flex-start",
    backgroundColor: colors.edge,
    borderRadius: 8,
    height: 180,
    width: 124,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  available: {
    color: colors.primary,
    fontWeight: "700",
  },
  checkedOut: {
    color: colors.danger,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
})
