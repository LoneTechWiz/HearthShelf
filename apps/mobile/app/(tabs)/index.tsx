import { useCallback } from "react"
import { StyleSheet, Text, View } from "react-native"
import { AuthGate } from "../../components/auth-gate"
import { Card, EmptyState, ErrorState, LoadingState, Screen } from "../../components/screen"
import { getDashboard } from "../../lib/api"
import { colors, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function HomeScreen() {
  const load = useCallback(() => getDashboard(), [])
  const { data, loading, error, reload } = useCachedQuery("dashboard", load)

  return (
    <AuthGate>
      <Screen title="Home" subtitle="Library status and recent movement.">
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data ? (
          <>
            <View style={styles.stats}>
              <Stat label="Books" value={data.stats.totalBooks} />
              <Stat label="Movies" value={data.stats.totalMovies} />
              <Stat label="Games" value={data.stats.totalGames} />
              <Stat label="Out" value={data.stats.checkedOutNow} />
            </View>
            <Card>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              {data.recentActivity.length === 0 ? (
                <Text style={styles.muted}>No checkout activity yet.</Text>
              ) : (
                data.recentActivity.map((activity) => (
                  <Text key={`${activity.checkoutId}-${activity.type}`} style={styles.muted}>
                    {activity.type === "return" ? "Returned" : "Checked out"} {activity.itemTitle}
                  </Text>
                ))
              )}
            </Card>
          </>
        ) : !loading && !error ? (
          <EmptyState message="No dashboard data yet." />
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  stats: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
})
