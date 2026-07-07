import type { ComponentProps } from "react"
import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { colors } from "../../lib/theme"

type IconName = ComponentProps<typeof Ionicons>["name"]

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "home", inactive: "home-outline" },
  shelf: { active: "library", inactive: "library-outline" },
  collections: { active: "albums", inactive: "albums-outline" },
  checkouts: { active: "swap-horizontal", inactive: "swap-horizontal-outline" },
  more: {
    active: "ellipsis-horizontal-circle",
    inactive: "ellipsis-horizontal-circle-outline",
  },
}

function tabIcon(name: keyof typeof icons) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? icons[name].active : icons[name].inactive} size={size} color={color} />
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.edge,
          height: 70,
          paddingBottom: 10,
          paddingTop: 7,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("index") }} />
      <Tabs.Screen name="shelf" options={{ title: "Shelf", tabBarIcon: tabIcon("shelf") }} />
      <Tabs.Screen name="collections" options={{ title: "Collections", tabBarIcon: tabIcon("collections") }} />
      <Tabs.Screen name="checkouts" options={{ title: "Checkouts", tabBarIcon: tabIcon("checkouts") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tabIcon("more") }} />
    </Tabs>
  )
}
