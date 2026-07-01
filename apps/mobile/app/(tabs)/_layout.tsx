import { Tabs } from "expo-router"
import { colors } from "../../lib/theme"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.edge },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: () => null }} />
      <Tabs.Screen name="shelf" options={{ title: "Shelf", tabBarIcon: () => null }} />
      <Tabs.Screen name="collections" options={{ title: "Collections", tabBarIcon: () => null }} />
      <Tabs.Screen name="checkouts" options={{ title: "Checkouts", tabBarIcon: () => null }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: () => null }} />
    </Tabs>
  )
}
