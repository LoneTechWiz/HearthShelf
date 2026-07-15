import { useCallback } from "react"
import type { ComponentProps } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { AuthGate } from "../../components/auth-gate"
import { Button, Card, EmptyState, ErrorState, LoadingState, MetricCard, Pill, Screen, SecondaryButton, SectionHeader } from "../../components/screen"
import { getDashboard } from "../../lib/api"
import { useAuth } from "../../lib/auth"
import { colors, pressableRipple, radii, shadows, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

type IconName = ComponentProps<typeof Ionicons>["name"]

export default function HomeScreen() {
  const auth = useAuth()
  const router = useRouter()
  const load = useCallback(() => getDashboard(), [])
  const { data, loading, error, reload } = useCachedQuery("dashboard", load)
  const firstName = auth.user?.name?.split(" ")[0]
  const totalItems = data
    ? data.stats.totalBooks + data.stats.totalMovies + data.stats.totalGames
    : 0

  return (
    <AuthGate>
      <Screen
        eyebrow="HearthShelf"
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        subtitle={
          data
            ? `${totalItems} ${totalItems === 1 ? "item" : "items"} across books, movies, and games.`
            : "Library status and recent movement."
        }
      >
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data ? (
          <>
            <View style={styles.section}>
              <SectionHeader title="Quick actions" />
              <View style={styles.quickActions}>
                <SecondaryButton label="Add Book" onPress={() => router.push({ pathname: "/item/new", params: { type: "book" } })} />
                <SecondaryButton label="Add Movie" onPress={() => router.push({ pathname: "/item/new", params: { type: "movie" } })} />
                <SecondaryButton label="Add Game" onPress={() => router.push({ pathname: "/item/new", params: { type: "game" } })} />
                <Button label="Check Out" onPress={() => router.push("/checkouts/new")} />
              </View>
            </View>
            <View style={styles.stats}>
              <MetricCard label="Shelf" value={totalItems} />
              <MetricCard label="Checked out" value={data.stats.checkedOutNow} />
              <MetricCard label="Overdue" value={data.stats.overdue} tone={data.stats.overdue > 0 ? "danger" : "neutral"} />
              <MetricCard label="Contacts" value={data.stats.totalContacts} />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Shelf overview" subtitle="Quick access to each collection." />
              <View style={styles.overviewGrid}>
                <OverviewCard
                  icon="book-outline"
                  label="Books"
                  value={data.stats.totalBooks}
                  onPress={() => router.push({ pathname: "/(tabs)/shelf", params: { type: "book" } })}
                />
                <OverviewCard
                  icon="film-outline"
                  label="Movies"
                  value={data.stats.totalMovies}
                  onPress={() => router.push({ pathname: "/(tabs)/shelf", params: { type: "movie" } })}
                />
                <OverviewCard
                  icon="game-controller-outline"
                  label="Games"
                  value={data.stats.totalGames}
                  onPress={() => router.push({ pathname: "/(tabs)/shelf", params: { type: "game" } })}
                />
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Recent activity" subtitle="The latest lending movement." />
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No lending activity" message="Checkout and return activity will show up here." />
              ) : (
                <Card style={styles.listCard}>
                  {data.recentActivity.map((activity, index) => (
                    <View
                      key={`${activity.checkoutId}-${activity.type}`}
                      style={[
                        styles.activityRow,
                        index < data.recentActivity.length - 1 && styles.divider,
                      ]}
                    >
                      <View style={styles.activityText}>
                        <Text style={styles.activityTitle} numberOfLines={1}>{activity.itemTitle}</Text>
                        <Text style={styles.muted} numberOfLines={2}>
                          {activity.type === "return" ? "Returned" : "Checked out"}
                          {activity.contactName ? ` by ${activity.contactName}` : ""}
                        </Text>
                      </View>
                      <Pill label={formatShortDate(activity.at)} tone={activity.type === "return" ? "success" : "accent"} />
                    </View>
                  ))}
                </Card>
              )}
            </View>
          </>
        ) : !loading && !error ? (
          <EmptyState title="No dashboard data" message="Your shelf summary will appear after the first sync." />
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function OverviewCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName
  label: string
  value: number
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      android_ripple={pressableRipple}
      style={({ pressed }) => [styles.overviewCard, pressed && styles.overviewCardPressed]}
      onPress={onPress}
    >
      <View style={styles.overviewIcon}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View>
        <Text style={styles.overviewValue}>{value}</Text>
        <Text style={styles.muted}>{label}</Text>
      </View>
    </Pressable>
  )
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value))
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  overviewGrid: {
    gap: spacing.md,
  },
  overviewCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.lg,
    borderWidth: 1,
    cursor: "pointer",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  overviewCardPressed: {
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.99 }],
  },
  overviewIcon: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  overviewValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },
  listCard: {
    gap: 0,
    paddingVertical: 0,
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  activityText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  activityTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  divider: {
    borderBottomColor: colors.edge,
    borderBottomWidth: 1,
  },
})
