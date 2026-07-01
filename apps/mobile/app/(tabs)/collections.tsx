import { useCallback } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthGate } from "../../components/auth-gate"
import { Card, EmptyState, ErrorState, LoadingState, Screen } from "../../components/screen"
import { getCollections } from "../../lib/api"
import { colors } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function CollectionsScreen() {
  const load = useCallback(() => getCollections(), [])
  const { data, loading, error, reload } = useCachedQuery("collections", load)

  return (
    <AuthGate>
      <Screen title="Collections" subtitle="Grouped views for authors, series, and categories.">
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data ? (
          <>
            <CollectionGroup title="Authors" rows={data.authors} />
            <CollectionGroup title="Book series" rows={data.series} />
            <CollectionGroup title="Movie series" rows={data.movieSeries} />
            <CollectionGroup title="Game genres" rows={data.gameGenres} />
          </>
        ) : !loading && !error ? (
          <EmptyState message="No collections yet." />
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
    <Card>
      <Text style={styles.title}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.muted}>None yet.</Text>
      ) : (
        rows.map((row) => (
          <Text key={row.key} style={styles.muted}>
            {row.label} · {row.count}
          </Text>
        ))
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
})
