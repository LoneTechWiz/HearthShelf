import { useCallback } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ItemType } from "@my-shelf/types"
import { AuthGate } from "../../../../../components/auth-gate"
import { ItemForm } from "../../../../../components/item-form"
import { ErrorState, LoadingState, Screen } from "../../../../../components/screen"
import { getItem } from "../../../../../lib/api"
import { useCachedQuery } from "../../../../../lib/use-cached-query"

function isItemType(value: string): value is ItemType {
  return value === "book" || value === "movie" || value === "game"
}

export default function EditItemScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ type: string; id: string }>()
  const type = isItemType(params.type) ? params.type : "book"
  const load = useCallback(() => getItem(type, params.id), [type, params.id])
  const { data, loading, error, reload } = useCachedQuery(`item:${type}:${params.id}`, load)

  return (
    <AuthGate>
      <Screen
        title="Edit Item"
        subtitle={data?.item ? data.item.title : "Update shelf details."}
      >
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data?.item ? (
          <ItemForm
            type={type}
            item={data.item}
            onSaved={() => router.replace({ pathname: "/item/[type]/[id]", params: { type, id: params.id } })}
          />
        ) : null}
      </Screen>
    </AuthGate>
  )
}
