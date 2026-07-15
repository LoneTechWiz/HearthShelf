import { useRouter, useLocalSearchParams } from "expo-router"
import type { ItemType } from "@my-shelf/types"
import { AuthGate } from "../../../components/auth-gate"
import { ItemForm } from "../../../components/item-form"
import { Screen } from "../../../components/screen"

function parseType(value: string | string[] | undefined): ItemType {
  return value === "movie" || value === "game" ? value : "book"
}

const labels: Record<ItemType, string> = {
  book: "Book",
  movie: "Movie",
  game: "Game",
}

export default function NewItemScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ type?: string; isbn?: string }>()
  const type = parseType(params.type)

  return (
    <AuthGate>
      <Screen
        title={`Add ${labels[type]}`}
        subtitle="Create a new shelf item."
        back={{ label: "Shelf", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/shelf") }}
      >
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
