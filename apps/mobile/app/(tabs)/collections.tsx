import { useCallback } from "react"
import { StyleSheet, Text, View } from "react-native"
import { AuthGate } from "../../components/auth-gate"
import { Card, EmptyState, ErrorState, LoadingState, Pill, Screen, SectionHeader } from "../../components/screen"
import { getCollections } from "../../lib/api"
import { colors, spacing } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function CollectionsScreen() {
  const load = useCallback(() => getCollections(), [])
  const { data, loading, error, reload } = useCachedQuery("collections", load)

  return (
    <AuthGate>
      <Screen title="Collections" subtitle="Browse grouped views across books, movies, and games.">
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data ? (
          <View style={styles.sections}>
            <View style={styles.section}>
              <SectionHeader title="Books" subtitle="Authors and series from your shelf." />
              <CollectionGroup title="Authors" rows={data.authors} />
              <CollectionGroup title="Book series" rows={data.series} />
            </View>
            <View style={styles.section}>
              <SectionHeader title="Movies" subtitle="Series across your movie shelf." />
              <CollectionGroup title="Movie series" rows={data.movieSeries} />
            </View>
            <View style={styles.section}>
              <SectionHeader title="Games" subtitle="Grouped by genre." />
              <CollectionGroup title="Game genres" rows={data.gameGenres} />
            </View>
          </View>
        ) : !loading && !error ? (
          <EmptyState title="No collections yet" message="Collections appear as you add authors, series, and genres." />
        ) : null}
      </Screen>
    </AuthGate>
  )
}

function CollectionGroup({
  title,
  rows,
}: {
  title: string
  rows: Array<{ key: string; label: string; count: number }>
}) {
  return (
    <Card style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.title}>{title}</Text>
        <Pill label={`${rows.length}`} tone="accent" />
      </View>
      {rows.length === 0 ? (
        <Text style={styles.muted}>None yet.</Text>
      ) : (
        rows.map((row, index) => (
          <View key={row.key} style={[styles.row, index < rows.length - 1 && styles.divider]}>
            <Text style={styles.rowLabel} numberOfLines={1}>{row.label}</Text>
            <Pill label={`${row.count}`} />
          </View>
        ))
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  groupCard: {
    gap: 0,
    paddingVertical: spacing.md,
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: spacing.sm,
  },
  divider: {
    borderBottomColor: colors.edge,
    borderBottomWidth: 1,
  },
})
