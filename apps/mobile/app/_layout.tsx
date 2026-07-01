import { Stack } from "expo-router"
import { AuthProvider } from "../lib/auth"
import { colors } from "../lib/theme"

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/[type]/[id]" options={{ title: "Item details" }} />
      </Stack>
    </AuthProvider>
  )
}
