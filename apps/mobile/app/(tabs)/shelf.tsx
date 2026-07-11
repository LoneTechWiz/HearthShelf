import { useCallback, useEffect, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ItemType, MobileShelfItem } from "@my-shelf/types"
import { AuthGate } from "../../components/auth-gate"
import { ItemRow } from "../../components/item-row"
import { EmptyState, ErrorState, LoadingState, Screen, SegmentedControl } from "../../components/screen"
import { getItems } from "../../lib/api"
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
        <SegmentedControl
          options={types.map((itemType) => ({ label: labels[itemType].plural, value: itemType }))}
          value={type}
          onChange={setType}
        />
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
