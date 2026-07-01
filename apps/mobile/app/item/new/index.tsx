import { useRouter, useLocalSearchParams } from "expo-router"
import type { ItemType } from "@my-shelf/types"
import { AuthGate } from "../../../components/auth-gate"
import { ItemForm } from "../../../components/item-form"
import { Screen } from "../../../components/screen"

function parseType(value: string | string[] | undefined): ItemType {
  return value === "movie" || value === "game" ? value : "book"
}

export default function NewItemScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ type?: string; isbn?: string }>()
  const type = parseType(params.type)

  return (
    <AuthGate>
      <Screen title={`Add ${type}`} subtitle="Create a new shelf item.">
        <ItemForm
          type={type}
          isbn={params.isbn}
          onSaved={() => router.replace("/(tabs)/shelf")}
          onScanIsbn={type === "book" ? () => router.push("/scan/isbn") : undefined}
        />
      </Screen>
    </AuthGate>
  )
}
