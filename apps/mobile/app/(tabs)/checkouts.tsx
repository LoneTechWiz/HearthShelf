import { useCallback } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthGate } from "../../components/auth-gate"
import { Card, EmptyState, ErrorState, LoadingState, Screen, SecondaryButton } from "../../components/screen"
import { getCheckouts, returnCheckout } from "../../lib/api"
import { colors } from "../../lib/theme"
import { useCachedQuery } from "../../lib/use-cached-query"

export default function CheckoutsScreen() {
  const load = useCallback(() => getCheckouts(), [])
  const { data, loading, error, reload } = useCachedQuery("checkouts", load)

  return (
    <AuthGate>
      <Screen title="Checkouts" subtitle="Items currently away from the shelf.">
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {data?.active.map((checkout) => (
          <Card key={checkout.id}>
            <Text style={styles.title}>{checkout.item.title}</Text>
            <Text style={styles.muted}>
              {checkout.contact ? `With ${checkout.contact.name}` : "Marked with owner"}
            </Text>
            {checkout.dueDate ? <Text style={styles.muted}>Due {new Date(checkout.dueDate).toLocaleDateString()}</Text> : null}
            <SecondaryButton
              label="Mark returned"
              onPress={() => void returnCheckout(checkout.id).then(() => reload())}
            />
          </Card>
        ))}
        {!loading && !error && data?.active.length === 0 ? (
          <EmptyState message="No active checkouts." />
        ) : null}
      </Screen>
    </AuthGate>
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
